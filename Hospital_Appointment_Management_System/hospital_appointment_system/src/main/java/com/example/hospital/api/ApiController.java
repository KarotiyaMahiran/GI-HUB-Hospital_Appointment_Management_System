package com.example.hospital.api;

import com.example.hospital.doctor.*;
import com.example.hospital.patient.*;
import com.example.hospital.appointment.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {
  private final DoctorRepository doctors;
  private final PatientRepository patients;
  private final AppointmentRepository appointments;
  public ApiController(DoctorRepository d, PatientRepository p, AppointmentRepository a) {
    doctors=d; patients=p; appointments=a;
  }

  @GetMapping("/doctors")
  public Object doctors(){ return doctors.findAll(); }

  @GetMapping("/admin/patients")
  public Object patients(){ return patients.findAll(); }

  @PostMapping("/admin/patients")
  public Object addPatient(@Valid @RequestBody PatientInput in) {
    Patient p = new Patient(); p.setName(in.name()); p.setAge(in.age()); p.setGender(in.gender()); p.setPhone(in.phone());
    return patients.save(p);
  }

  @PutMapping("/admin/patients/{id}")
  public Object updatePatient(@PathVariable Integer id, @Valid @RequestBody PatientInput in) {
    Patient p = patients.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    p.setName(in.name()); p.setAge(in.age()); p.setGender(in.gender()); p.setPhone(in.phone());
    return patients.save(p);
  }

  @GetMapping("/admin/appointments")
  public Object appointments(){ return appointments.findAll(); }

  @PostMapping("/admin/appointments")
  public Object addAppointment(@Valid @RequestBody AppointmentInput in) {
    if (!patients.existsById(in.patientId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient not found");
    if (!doctors.existsById(in.doctorId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor not found");
    Appointment a = new Appointment(); a.setPatientId(in.patientId()); a.setDoctorId(in.doctorId());
    a.setDate(in.date()); a.setTime(in.time()); a.setStatus("Pending");
    return appointments.save(a);
  }

  @PatchMapping("/admin/appointments/{id}/status")
  public Object updateStatus(@PathVariable Integer id, @RequestBody StatusInput in) {
    if (!java.util.Set.of("Pending","Confirmed","Completed","Cancelled").contains(in.status()))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    Appointment a = appointments.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    a.setStatus(in.status()); return appointments.save(a);
  }

  public record PatientInput(@NotBlank @Size(max=100) String name, @Min(0) @Max(120) Integer age,
    @Size(max=10) String gender, @Size(max=15) String phone) {}
  public record AppointmentInput(@Positive Integer patientId, @Positive Integer doctorId,
    @NotNull LocalDate date, @NotNull LocalTime time) {}
  public record StatusInput(@NotBlank String status) {}
}
