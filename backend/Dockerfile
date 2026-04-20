# ---- Build stage ----
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

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

RUN addgroup -S crm && adduser -S crm -G crm
USER crm

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
