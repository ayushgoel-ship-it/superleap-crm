# `viz-service` Backend Principles

**Date:** April 10, 2026  
**Purpose:** Authoritative D4 translation of `../viz-service` backend structure into implementation standards for the new CRM backend  
**Status:** Phase 1 D4 complete

---

## Scope And Sources

- This document captures implementation standards to copy from `../viz-service`, not a requirement to clone its codebase or domain model.
- CRM copies the architectural shape from those sources, but the approved CRM implementation toolchain is Maven on Java 17.
- Primary sources inspected:
  - `../viz-service/settings.gradle`
  - `../viz-service/build.gradle`
  - `../viz-service/viz-api/build.gradle`
  - `../viz-service/viz-core/build.gradle`
  - `../viz-service/viz-pipeline/build.gradle`
  - `../viz-service/viz-notification/build.gradle`
  - `../viz-service/viz-api/src/main/java/.../config/FilterConfig.java`
  - `../viz-service/viz-api/src/main/java/.../filter/JwtTokenFilter.java`
  - `../viz-service/viz-api/src/main/java/.../filter/AuthenticationFilter.java`
  - `../viz-service/viz-api/src/main/java/.../exception/GlobalControllerAdvice.java`
  - representative controller, API service, core service, repository, Feign client, listener, processor, and publisher classes
- D4 output is an implementation-standard reference for CRM tasks `B1`, `B3`, `DB3`, `A1`, and `A6`.

## Multi-Module Layout To Mirror

### What `viz-service` Uses

`settings.gradle` defines these modules:

- `viz-api`
- `viz-core`
- `viz-pipeline`
- `tp-pipeline`
- `viz-notification`
- `auth`

The main architectural pattern is driven by four modules:

- `viz-api`
- `viz-core`
- `viz-pipeline`
- `viz-notification`

`tp-pipeline` is a domain-specific extra pipeline module, and `auth` is a separate auth-related repo module, not part of the core CRM shape to reproduce by default.

### CRM Standard

CRM should adopt this target module layout:

- `crm-api`
- `crm-core`
- `crm-pipeline`
- `crm-notification`

CRM build standard:

- `backend/pom.xml` is the parent multi-module build entrypoint.
- each module owns its own `pom.xml`.
- `backend/mvnw` is the repo-local build entrypoint.
- Java 17 is the approved backend baseline for CRM.

Implementation rule:

- `crm-api` is the application entrypoint and API boundary.
- `crm-core` holds business logic, repositories, shared config, external clients, and utility/publisher code.
- `crm-pipeline` holds async listeners and processors for non-request flows.
- `crm-notification` is part of the current scaffold and should stay narrowly focused on notification-specific behavior.

## Module Responsibility Standards

### `crm-api`

Copy from `viz-api`:

- Spring Boot app bootstrap
- controller packages split by audience
- filter registration and request auth pipeline
- API DTOs and API-facing service interfaces/impls
- centralized exception translation

CRM package standard:

- `controller/web`
- `controller/app`
- `controller/internal`
- `controller/publicapi`
- `filter`
- `config`
- `exception`
- `dto/common`
- `dto/<channel>/request`
- `dto/<channel>/response`

Implementation rule:

- Controllers must stay thin and delegate immediately.
- Controllers should not own business logic, repository access, or external-client coordination.
- Enforce this first through package-level docs and review expectations; add automated architecture checks later only when controller surface area justifies the extra toolchain.

### `crm-core`

Copy from `viz-core`:

- internal service interfaces and implementations
- storage-specific repository packages
- shared configuration classes
- external REST clients and their wrappers
- publisher abstractions for Rabbit/PubSub-style event emission
- shared exceptions, models, and utility code

CRM package standard:

- `service/internal`
- `service/external`
- `service/impl`
- `repository/postgres`
- `repository/redis`
- `entity`
- `dto`
- `model`
- `config`
- `external/restclient`
- `exception`
- `util`

Implementation rule:

- `crm-core` owns business rules and orchestration.
- `crm-core` may depend on multiple infrastructure types, but those dependencies stay behind services/repositories instead of leaking into controllers.

### `crm-pipeline`

Copy from `viz-pipeline`:

- listener -> processor structure
- isolated handling of async business events
- consumer beans/config in the pipeline module rather than in API controllers or core services

CRM package standard:

- `listener`
- `processor`
- `publisher`
- `config`

Implementation rule:

- Long-running, retryable, or event-driven workflows belong here.
- Synchronous request success must not depend on pipeline consumers succeeding in the same execution path.

### `crm-notification`

Copy from `viz-notification`:

- notification-specific listener/processor/service split
- delivery concerns isolated from generic business pipelines

Implementation rule:

- Keep this module focused on notification-specific delivery and orchestration concerns.
- If notification behavior stays small in v1, keep shared publishing contracts in `crm-core` and avoid pushing unrelated async work into this module.

## Filter-Chain Auth Pattern To Copy

### What `viz-service` Does

`viz-api` registers servlet filters through `FilterRegistrationBean` in `FilterConfig`.

Observed chain on `/app/v1/*`:

1. `LoggingFilter`
2. `JwtTokenFilter`
3. `AuthenticationFilter`

Responsibilities:

- `JwtTokenFilter`
  - reads Bearer token
  - parses JWT through a dedicated `JwtReader`
  - materializes an authentication object
  - stores normalized auth data on request attributes
- `AuthenticationFilter`
  - reads the normalized auth object
  - validates whether the request is authenticated
  - blocks invalid protected requests before controllers run

### CRM Standard

CRM should adopt the same high-level pattern:

1. request correlation/logging filter
2. token parsing and verification filter
3. authentication/authorization context filter

Implementation rule:

- Use a normalized request context object, not scattered request attributes as the long-term API for downstream code.
- Filter registration must target explicit protected namespaces such as `/web/v1/*`, `/app/v1/*`, and `/internal/v1/*`.
- Token verification must use the finalized company JWT contract from `S1`, not the lightweight parsing style found in legacy code.
- Controllers and services must depend on normalized request context, never on raw JWT parsing.

## Controller, Service, Repository Separation

### Observed `viz-service` Shape

Representative path:

- `DealerController` in `viz-api`
- `DealerApiServiceImpl` in `viz-api`
- `DealerService` / `DealerServiceImpl` in `viz-core`
- `DealerRepository` and `CustomDealerRepository` in `viz-core`
- `DealerProfileClient` and other Feign clients in `viz-core`

Observed separation:

- controllers parse HTTP input and enforce endpoint-level access checks
- API service layer adapts request DTOs and coordinates core services
- core services own domain behavior, fallbacks, cache behavior, and multi-dependency orchestration
- repositories are storage-facing and typed by backend technology
- external clients live behind interfaces/wrappers in core

### CRM Standard

- Controllers:
  - validate request shape
  - map headers/query/path/body into request DTOs
  - delegate to API/core services
  - return DTO responses only
- API services:
  - orchestrate request-specific flows
  - adapt request context to business-service calls
  - keep transport concerns out of core services
- Core services:
  - own business logic, read-model assembly, validation, and command behavior
  - coordinate repositories, cache, external clients, and event publication
- Repositories:
  - stay infrastructure-specific
  - expose domain-meaningful methods, not controller-shaped operations

Implementation rule:

- No controller should call repositories directly.
- No controller should call Feign/external clients directly.
- If logic is reused across controllers or requires multiple data sources, it belongs in core services.

## Exception Handling And Shared Config Conventions

### What `viz-service` Does

- `GlobalControllerAdvice` in `viz-api` centralizes exception-to-response mapping.
- API and core layers define typed exceptions instead of relying only on generic runtime errors.
- Shared configuration sits in core:
  - `AppConfiguration` via `@ConfigurationProperties`
  - async config
  - Redis/Mongo/AWS/GCP/Feign config classes

### CRM Standard

- Centralize HTTP exception translation in `crm-api` with one controller advice.
- Keep business/infrastructure exceptions typed and located in stable packages.
- Keep shared configuration in `crm-core`, especially:
  - app properties
  - DB/cache configuration
  - async configuration
  - external client configuration
  - messaging configuration

Implementation rule:

- Controllers should throw typed exceptions or let service exceptions bubble up.
- Response format standardization belongs in API advice, not duplicated per controller.
- Exchange names, routing keys, service hosts, and feature flags should be bound through configuration properties classes, not hardcoded throughout services.

## External Client And Async Processing Patterns Worth Copying

### External Clients

Observed in `viz-core`:

- Feign clients live in `external/restclient`
- client-specific config classes live in `config/restclient`
- service implementations wrap those clients before business logic uses them

CRM standard:

- All outbound HTTP integrations should live in `crm-core/external/restclient`
- Wrap raw clients in external service classes when domain translation or retry/error mapping is needed
- Do not call third-party or internal services directly from controllers

### Event Publishing

Observed in `viz-core`:

- `MessagePublisherService` abstracts Rabbit/PubSub publishing
- domain-specific publishers such as `NotificationEventPublisher` wrap messaging details

CRM standard:

- publish typed business events through dedicated publisher wrappers
- keep broker exchange/routing details out of business services where possible

### Async Consumption

Observed in `viz-pipeline` and `viz-notification`:

- listeners are small consumer definitions
- processors hold event-handling logic
- processors delegate back to core services
- exceptions are logged and rethrown so queue semantics can retry

CRM standard:

- listener beans define transport binding only
- processors coordinate event handling
- durable business state changes remain in core services
- retry/requeue behavior is explicit and compatible with the chosen broker

## Copy Vs Improve Decisions

### Copy

- multi-module separation into API, core, pipeline, and optional notification areas
- thin-controller rule
- centralized filter registration for protected namespaces
- centralized controller advice
- storage-specific repository packaging
- external client isolation in core
- publisher/listener/processor separation for async flows
- configuration properties classes for shared runtime settings

### Improve

- use CRM package names and only the modules CRM actually needs
- replace request-attribute-heavy auth access with a normalized request context model
- define route namespaces early and apply filters consistently to them
- keep async isolation, but only for workflows that justify it
- keep the module boundary pattern without copying `tp-pipeline` or unrelated domain complexity

### Do Not Copy Blindly

- mixed persistence stack choices from `viz-core`
- domain-specific module split like `tp-pipeline`
- ad hoc `RestTemplate` usage in controllers
- broad component scanning as a substitute for clear ownership
- auth behavior that parses tokens without CRM’s finalized JWT trust contract

## CRM Implementation Standards Derived From D4

- `B1`: create `backend/` as a multi-module Maven project on Java 17 with `crm-api`, `crm-core`, `crm-pipeline`, and `crm-notification`
- `B3`: build auth as a filter pipeline that produces normalized request context before controllers execute
- `DB3`: keep read-model repositories and storage concerns in core, not in controllers
- `A1`: publish one contract-first API catalog with explicit `/public`, `/web`, `/app`, and `/internal` namespaces
- `A6`: isolate exports, notifications, bulk imports, and similar async workflows in pipeline-style modules instead of mixing them into synchronous request handling

## D4 Coverage Checklist

| D4 Requirement | Covered In |
| --- | --- |
| Record multi-module layout from `settings.gradle` | Multi-Module Layout section |
| Record responsibilities of `viz-api`, `viz-core`, `viz-pipeline`, and `viz-notification` | Module Responsibility Standards section |
| Record filter-chain auth pattern from `FilterConfig`, `JwtTokenFilter`, and `AuthenticationFilter` | Filter-Chain Auth Pattern section |
| Record controller/service/repository separation patterns | Controller, Service, Repository Separation section |
| Record exception handling and shared config conventions | Exception Handling And Shared Config Conventions section |
| Record external client and async processing patterns worth copying | External Client And Async Processing Patterns section |

## Assumptions

- CRM should copy `viz-service` architecture shape, not its exact storage stack or domain-specific services.
- `crm-notification` is part of the current CRM scaffold, but its responsibility should remain tightly scoped.
- CRM backend implementation uses Maven and Java 17 even though the reference system was inspected through Gradle files.
- The API module should be the main boot application that component-scans CRM modules, but module ownership should stay explicit enough that scanning does not become the design.
