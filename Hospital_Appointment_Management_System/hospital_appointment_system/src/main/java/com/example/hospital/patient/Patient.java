package com.example.hospital.patient;

import jakarta.persistence.*;

@Entity
@Table(name="patients")
public class Patient {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
  @Column(name="patient_id") private Integer id;
  @Column(name="patient_name", nullable=false, length=100) private String name;
  @Column(name="age") private Integer age;
  @Column(name="gender", length=10) private String gender;
  @Column(name="phone", length=15) private String phone;
  public Integer getId(){return id;} public String getName(){return name;}
  public Integer getAge(){return age;} public String getGender(){return gender;} public String getPhone(){return phone;}
  public void setName(String v){name=v;} public void setAge(Integer v){age=v;} public void setGender(String v){gender=v;} public void setPhone(String v){phone=v;}
}
