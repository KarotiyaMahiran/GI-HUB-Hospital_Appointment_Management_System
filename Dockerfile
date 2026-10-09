FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY Hospital_Appointment_Management_System/hospital_appointment_system/pom.xml ./pom.xml
COPY Hospital_Appointment_Management_System/hospital_appointment_system/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/hospital-appointment-system-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
