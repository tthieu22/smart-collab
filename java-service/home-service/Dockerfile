# Stage 1: Build với Maven
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
# Copy pom.xml và tải dependencies trước để tận dụng cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy code và build
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Chạy ứng dụng
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Tối ưu RAM cho môi trường Free Tier (giới hạn dùng tối đa 384MB)
ENTRYPOINT ["java", "-Xmx384m", "-Xms256m", "-jar", "app.jar"]
