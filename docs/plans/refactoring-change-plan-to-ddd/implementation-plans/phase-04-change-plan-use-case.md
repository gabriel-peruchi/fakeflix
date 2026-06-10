# Phase 4: Change Plan Use Case

## Objetivo

Criar o Use Case `ChangePlanUseCase` que orquestra a mudança de plano usando o Domain Entity. Este use case encapsula o fluxo completo, incluindo salvamento de eventos no Outbox.

## Pré-requisitos

- [x] Phase 1 completada (Foundation - Outbox)
- [x] Phase 2 completada (Value Objects)
- [x] Phase 3 completada (Subscription Aggregate)

## Estimativa

- **Esforço**: 3-4 horas
- **Risco**: Baixo (não modifica fluxo existente ainda)
- **PRs**: 1

---

## Contexto para IA

### Documento de Referência

- `docs/REFACTORING-CHANGE-PLAN-TO-DDD.md` - Seção "Change Plan Use Case"

### Padrões a Seguir

- Services existentes: `src/module/billing/subscription/core/service/subscription-billing.service.ts`
- Use Cases (se existirem): `src/module/content/admin/core/use-case/`

### Princípios do Use Case

- **Orquestração apenas**: Não contém lógica de negócio (essa está no Aggregate)
- **Single responsibility**: Coordena o fluxo
- **Transacional**: Usa `@Transactional({ connectionName: 'billing' })`
- **Salva eventos no Outbox**: Na mesma transação do aggregate

### Constraints

- Use Cases ficam em `subscription/core/use-case/` (dentro da feature folder)
- Domain Services ficam em `subscription/domain/service/`
- Use Case injeta repositórios diretamente (não usa interfaces)
- Lógica de negócio está no Domain Entity, não no Use Case

---

## Arquivos a Criar

| #   | Arquivo                                                                                 | Descrição       |
| --- | --------------------------------------------------------------------------------------- | --------------- |
| 1   | `src/module/billing/subscription/core/use-case/change-plan/change-plan.command.ts`      | Command (input) |
| 2   | `src/module/billing/subscription/core/use-case/change-plan/change-plan.use-case.ts`     | Use Case        |
| 3   | `src/module/billing/subscription/core/use-case/change-plan/index.ts`                    | Barrel export   |
| 4   | `src/module/billing/subscription/domain/service/proration-calculator.domain-service.ts` | Domain Service  |

## Arquivos a Modificar

| Arquivo                                | Mudança                             |
| -------------------------------------- | ----------------------------------- |
| `src/module/billing/billing.module.ts` | Registrar Use Case e Domain Service |

---

## Passos de Implementação

### Passo 1: Criar estrutura de pastas

```bash
mkdir -p src/module/billing/subscription/core/use-case/change-plan
mkdir -p src/module/billing/subscription/domain/service
```

- [ ] Criar pastas

---

### Passo 2: Criar Command

**Arquivo**: `src/module/billing/subscription/core/use-case/change-plan/change-plan.command.ts`

```typescript
/**
 * Command para mudança de plano.
 *
 * Imutável, contém apenas dados de entrada.
 * Validação de formato pode ser feita aqui (via class-validator se desejado).
 */
export class ChangePlanCommand {
  constructor(
    /**
     * ID do usuário que está mudando o plano
     */
    public readonly userId: string,

    /**
     * ID da subscription a ser modificada
     */
    public readonly subscriptionId: string,

    /**
     * ID do novo plano
     */
    public readonly newPlanId: string,

    /**
     * Data efetiva da mudança (opcional, default: agora)
     */
    public readonly effectiveDate?: Date,

    /**
     * Se deve manter add-ons compatíveis (opcional, default: true)
     */
    public readonly keepAddOns?: boolean,
  ) {}
}
```

- [ ] Criar arquivo

---

### Passo 3: Criar Domain Service para Proration

**Arquivo**: `src/module/billing/subscription/domain/service/proration-calculator.domain-service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { BillingPeriod } from '../value-object/billing-period';

/**
 * Resultado do cálculo de proration
 */
export interface ProrationResult {
  amount: Decimal;
  days: number;
  rate: Decimal;
}

/**
 * Domain Service para cálculo de proration.
 *
 * Stateless - apenas cálculos puros.
 * Não acessa banco de dados.
 */
@Injectable()
export class ProrationCalculatorDomainService {
  /**
   * Calcula crédito de proration para plano antigo.
   *
   * Crédito = (dias restantes / total dias) * valor do plano
   */
  calculateCredit(
    billingPeriod: BillingPeriod,
    planAmount: Decimal,
    effectiveDate: Date,
  ): ProrationResult {
    const rate = billingPeriod.getProrationRate(effectiveDate);
    const amount = planAmount.times(rate);
    const days = billingPeriod.getDaysRemaining(effectiveDate);

    return {
      amount: amount.negated(), // Crédito é negativo
      days,
      rate,
    };
  }

  /**
   * Calcula cobrança de proration para plano novo.
   *
   * Cobrança = (dias restantes / total dias) * valor do novo plano
   */
  calculateCharge(
    billingPeriod: BillingPeriod,
    newPlanAmount: Decimal,
    effectiveDate: Date,
  ): ProrationResult {
    const rate = billingPeriod.getProrationRate(effectiveDate);
    const amount = newPlanAmount.times(rate);
    const days = billingPeriod.getDaysRemaining(effectiveDate);

    return {
      amount, // Cobrança é positivo
      days,
      rate,
    };
  }

  /**
   * Calcula o valor líquido (cobrança - crédito)
   */
  calculateNetProration(
    credit: ProrationResult,
    charge: ProrationResult,
  ): Decimal {
    return charge.amount.plus(credit.amount);
  }
}
```

- [ ] Criar arquivo

---

### Passo 4: Criar Use Case

**Arquivo**: `src/module/billing/subscription/core/use-case/change-plan/change-plan.use-case.ts`

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { Subscription } from '../../domain/entity/subscription';
import { SubscriptionRepository } from '../../persistence/repository/subscription.repository';
import { PlanRepository } from '../../persistence/repository/plan.repository';
import { OutboxRepository } from '../../../shared/persistence/outbox/outbox.repository';
import { OutboxEvent } from '../../../shared/persistence/outbox/outbox-event.entity';
import { ProrationCalculatorDomainService } from '../../domain/service/proration-calculator.domain-service';
import { ChangePlanCommand } from './change-plan.command';

/**
 * Resultado do Use Case
 */
export interface ChangePlanResult {
  subscriptionId: string;
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: Decimal;
  prorationCharge: Decimal;
  netAmount: Decimal;
  addOnsRemoved: number;
}

/**
 * USE CASE: Mudar plano de subscription
 *
 * Orquestra o fluxo de mudança de plano:
 * 1. Carrega aggregate
 * 2. Valida ownership
 * 3. Calcula proration (via Domain Service)
 * 4. Executa operação no aggregate
 * 5. Salva aggregate
 * 6. Salva eventos no Outbox
 *
 * A lógica de negócio está no Subscription aggregate.
 * Este use case apenas orquestra o fluxo.
 */
@Injectable()
export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly prorationCalculator: ProrationCalculatorDomainService,
  ) {}

  /**
   * Executa a mudança de plano
   */
  @Transactional({ connectionName: 'billing' })
  async execute(command: ChangePlanCommand): Promise<ChangePlanResult> {
    // 1. Carrega subscription aggregate (Domain Entity)
    const subscription = await this.subscriptionRepository.findByDomainId(
      command.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // 2. Valida ownership
    if (subscription.userId !== command.userId) {
      throw new BadRequestException('Subscription does not belong to user');
    }

    // 3. Carrega novo plano (ORM entity para dados)
    const newPlan = await this.planRepository.findOneById(command.newPlanId);

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // 4. Carrega plano atual para cálculo
    const currentPlan = await this.planRepository.findOneById(
      subscription.planId,
    );

    if (!currentPlan) {
      throw new NotFoundException('Current plan not found');
    }

    // 5. Calcula proration (Domain Service)
    const effectiveDate = command.effectiveDate || new Date();

    const creditResult = this.prorationCalculator.calculateCredit(
      subscription.billingPeriod,
      new Decimal(currentPlan.amount),
      effectiveDate,
    );

    const chargeResult = this.prorationCalculator.calculateCharge(
      subscription.billingPeriod,
      new Decimal(newPlan.amount),
      effectiveDate,
    );

    // 6. Executa operação no aggregate (TODA lógica de negócio aqui)
    const result = subscription.changePlan(
      newPlan.id,
      newPlan.allowedAddOns || [],
      creditResult.amount.abs(), // Passa como positivo
      chargeResult.amount,
      effectiveDate,
    );

    // 7. Salva aggregate (converte Domain → ORM via mapper)
    await this.subscriptionRepository.saveDomain(subscription);

    // 8. Salva eventos no Outbox (mesma transação!)
    const events = subscription.pullEvents();
    for (const event of events) {
      const outboxEvent = OutboxEvent.fromDomainEvent({
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        payload: event.payload,
      });
      await this.outboxRepository.save(outboxEvent);
    }

    // 9. Retorna resultado
    return {
      subscriptionId: subscription.id,
      oldPlanId: result.oldPlanId,
      newPlanId: result.newPlanId,
      prorationCredit: creditResult.amount.abs(),
      prorationCharge: chargeResult.amount,
      netAmount: this.prorationCalculator.calculateNetProration(
        creditResult,
        chargeResult,
      ),
      addOnsRemoved: result.addOnsRemoved.length,
    };
  }
}
```

- [ ] Criar arquivo

---

### Passo 5: Criar Barrel Export

**Arquivo**: `src/module/billing/subscription/core/use-case/change-plan/index.ts`

```typescript
export { ChangePlanCommand } from './change-plan.command';
export { ChangePlanUseCase, ChangePlanResult } from './change-plan.use-case';
```

- [ ] Criar arquivo

---

### Passo 6: Registrar no Module

**Arquivo**: `src/module/billing/billing.module.ts`

```typescript
import { ChangePlanUseCase } from './subscription/core/use-case/change-plan';
import { ProrationCalculatorDomainService } from './subscription/domain/service/proration-calculator.domain-service';

@Module({
  imports: [
    /* ... */
  ],
  providers: [
    // ... providers existentes

    // Domain Services
    ProrationCalculatorDomainService,

    // Use Cases
    ChangePlanUseCase,
  ],
  controllers: [
    /* ... */
  ],
  exports: [
    // ... exports existentes
    ChangePlanUseCase, // Exportar se for usado por outros módulos
  ],
})
export class BillingModule {}
```

- [ ] Adicionar `ProrationCalculatorDomainService` aos providers
- [ ] Adicionar `ChangePlanUseCase` aos providers
- [ ] Exportar se necessário

---

## Critérios de Aceitação

- [ ] `ChangePlanCommand` criado como DTO imutável
- [ ] `ProrationCalculatorDomainService` criado como serviço stateless
- [ ] `ChangePlanUseCase` criado com `@Transactional`
- [ ] Use Case salva eventos no Outbox na mesma transação
- [ ] Use Case não contém lógica de negócio (apenas orquestração)
- [ ] Aplicação compila sem erros
- [ ] Providers registrados no module

---

## Remoção do Código Antigo

⚠️ **O código antigo será removido na Phase 6 (Integration)**

O método `changePlan()` e `changePlanForUser()` do `SubscriptionBillingService` serão:

1. **Deprecados** na Phase 6 com feature flag
2. **Removidos** após validação em produção (ver `PHASE-06-integration.md` - Passo 9)

**Testes E2E**: Os testes e2e existentes em `src/module/billing/subscription/__test__/e2e/subscription-billing/subscription-billing.spec.ts` já cobrem o fluxo completo de mudança de plano. Quando o controller for atualizado na Phase 6 para usar o novo `ChangePlanUseCase`, esses testes automaticamente validarão o novo fluxo.

**Não é necessário** criar testes de integração específicos para o Use Case nesta fase, pois:

- Os testes e2e já validam o fluxo completo end-to-end
- Os testes unitários do Domain Entity (`subscription.changePlan()`) já validam a lógica de negócio
- O Use Case apenas orquestra, sem lógica adicional a testar isoladamente

---

## Rollback Plan

1. Remover arquivos criados:

   - `src/module/billing/subscription/core/use-case/change-plan/`
   - `src/module/billing/subscription/domain/service/proration-calculator.domain-service.ts`

2. Reverter mudanças no `billing.module.ts`

---

## Verificação Final

```bash
# 1. Build
npm run build

# 2. Testes
npm run test -- --testPathPattern=billing

# 3. Lint
npm run lint

# 4. Verificar que Use Case pode ser injetado
# (criar um teste simples que injeta o use case)
```

---

## Nota Importante

⚠️ **Nesta fase, o Controller ainda usa o service antigo (`SubscriptionBillingService`).**

O Use Case está pronto mas não está conectado ao Controller ainda. Isso será feito na Phase 6 (Integration).

Isso permite:

- Testar o Use Case isoladamente
- Manter o sistema funcionando durante a migração
- Fazer rollback facilmente se necessário

---

## Próxima Fase

Após completar esta fase, prossiga para:
→ `PHASE-05-event-handlers.md` - Criar handlers que reagem aos eventos