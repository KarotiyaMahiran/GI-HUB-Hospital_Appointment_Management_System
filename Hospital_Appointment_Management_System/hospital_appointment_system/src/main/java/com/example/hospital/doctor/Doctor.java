package com.example.hospital.doctor;

import jakarta.persistence.*;

@Entity
@Table(name="doctors")
public class Doctor {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  @Column(name="doctor_id") private Integer id;
  @Column(name="doctor_name", nullable=false, length=100) private String name;
  @Column(name="specialization", nullable=false, length=100) private String specialization;
  @Column(name="phone", length=15) private String phone;
  public Integer getId(){return id;} public String getName(){return name;}
  public String getSpecialization(){return specialization;} public String getPhone(){return phone;}
  public void setName(String v){name=v;} public void setSpecialization(String v){specialization=v;} public void setPhone(String v){phone=v;}
}
