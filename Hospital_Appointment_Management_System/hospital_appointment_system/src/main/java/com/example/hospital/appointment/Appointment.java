package com.example.hospital.appointment;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name="appointments")
public class Appointment {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  @Column(name="appointment_id") private Integer id;
  @Column(name="patient_id", nullable=false) private Integer patientId;
  @Column(name="doctor_id", nullable=false) private Integer doctorId;
  @Column(name="appointment_date", nullable=false) private LocalDate date;
  @Column(name="appointment_time", nullable=false) private LocalTime time;
  @Column(name="status", length=20) private String status = "Pending";
  public Integer getId(){return id;} public Integer getPatientId(){return patientId;}
  public Integer getDoctorId(){return doctorId;} public LocalDate getDate(){return date;}
  public LocalTime getTime(){return time;} public String getStatus(){return status;}
  public void setPatientId(Integer v){patientId=v;} public void setDoctorId(Integer v){doctorId=v;}
  public void setDate(LocalDate v){date=v;} public void setTime(LocalTime v){time=v;}
  public void setStatus(String v){status=v;}
}
