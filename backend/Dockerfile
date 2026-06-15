# =====================================================================
# Superleap CRM backend image — multi-stage (build → slim JRE runtime)
#
# Corporate-proxy aware: drop any root-CA *.crt/*.pem into backend/certs/
# and both stages will trust it, so Maven Central (build) and outbound
# HTTPS (runtime → gateway.24c.in, Ola Maps) work behind a TLS-intercepting
# proxy such as the Cars24 Cloudflare Gateway. The directory ships empty,
# so this is a no-op on networks with direct egress (e.g. most CI runners).
#
# NOTE: pulling the base images below still requires the *Docker daemon*
# (not this Dockerfile) to trust the corporate CA. On a Cars24-managed CI
# runner that trust is already in place; on a laptop behind the proxy,
# configure the daemon's CA store once.
# =====================================================================

# ---- Build stage ----
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# --- optional corporate CA trust (build-time, for Maven Central) ---
# COPY runs before the dependency download so the trusted store is ready.
# certs/ contains only .gitkeep by default → the loop below is a no-op.
COPY certs/ /tmp/corp-certs/
RUN set -eu; \
    if ls /tmp/corp-certs/*.crt /tmp/corp-certs/*.pem >/dev/null 2>&1; then \
        echo "Importing corporate CA(s) into build trust store…"; \
        apk add --no-cache ca-certificates; \
        for c in /tmp/corp-certs/*.crt /tmp/corp-certs/*.pem; do \
            [ -e "$c" ] || continue; \
            cp "$c" "/usr/local/share/ca-certificates/$(basename "$c" .pem).crt"; \
            keytool -importcert -noprompt -trustcacerts \
                -alias "corp-$(basename "$c")" \
                -file "$c" \
                -keystore "$JAVA_HOME/lib/security/cacerts" \
                -storepass changeit || true; \
        done; \
        update-ca-certificates; \
    else \
        echo "No corporate CA supplied (backend/certs empty) — assuming direct egress."; \
    fi

# Copy Maven wrapper and POMs first (layer cache for dependencies)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY crm-core/pom.xml crm-core/pom.xml
COPY crm-pipeline/pom.xml crm-pipeline/pom.xml
COPY crm-notification/pom.xml crm-notification/pom.xml
COPY crm-api/pom.xml crm-api/pom.xml

RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build (skip tests — they run in CI)
COPY crm-core/src crm-core/src
COPY crm-pipeline/src crm-pipeline/src
COPY crm-notification/src crm-notification/src
COPY crm-api/src crm-api/src

RUN ./mvnw package -DskipTests -B && \
    mv crm-api/target/crm-api-*.jar /app/app.jar

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# tzdata + IST default so server-side timestamps and MTD aggregates compute
# in Asia/Kolkata, not UTC. (Go-live audit flagged UTC/IST drift in MTD
# rollups as a silent-failure mode — see docs/BUSINESS_CONTEXT.md.)
# wget (busybox) backs the HEALTHCHECK below. ca-certificates for the
# optional corporate-CA import that follows.
RUN apk add --no-cache tzdata ca-certificates
ENV TZ=Asia/Kolkata

# --- optional corporate CA trust (runtime, for outbound HTTPS) ---
COPY certs/ /tmp/corp-certs/
RUN set -eu; \
    if ls /tmp/corp-certs/*.crt /tmp/corp-certs/*.pem >/dev/null 2>&1; then \
        for c in /tmp/corp-certs/*.crt /tmp/corp-certs/*.pem; do \
            [ -e "$c" ] || continue; \
            cp "$c" "/usr/local/share/ca-certificates/$(basename "$c" .pem).crt"; \
            keytool -importcert -noprompt -trustcacerts \
                -alias "corp-$(basename "$c")" \
                -file "$c" \
                -keystore "$JAVA_HOME/lib/security/cacerts" \
                -storepass changeit || true; \
        done; \
        update-ca-certificates; \
    fi; \
    rm -rf /tmp/corp-certs

RUN addgroup -S crm && adduser -S crm -G crm
USER crm

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

# Liveness/readiness for k8s + docker-compose. Hits the actuator health
# endpoint (exposed in every profile). Gives the JVM 40s to warm up.
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+ExitOnOutOfMemoryError", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
