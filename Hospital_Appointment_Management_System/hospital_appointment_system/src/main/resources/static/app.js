const $ = (id) => document.getElementById(id);
const toast = (message) => {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 3500);
};
let adminAuth = '';
let patientRecords = [];

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (adminAuth) headers.Authorization = adminAuth;
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Sign-in failed or access denied. Check credentials and server settings.');
    }
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function loadDoctors() {
  const grid = $('doctorGrid');
  grid.innerHTML = '<p class="muted">Loading doctors…</p>';
  try {
    const doctors = await api('/api/doctors');
    if (!doctors.length) {
      grid.innerHTML = '<p class="muted">No doctors found in the configured doctors table yet.</p>';
      return;
    }
    grid.innerHTML = doctors.map((doctor, index) => `
      <article class="doctor-card">
        <div class="doctor-avatar">${['👨‍⚕️', '👩‍⚕️', '🩺'][index % 3]}</div>
        <h3>${escapeHtml(doctor.name || 'Doctor')}</h3>
        <p>${escapeHtml(doctor.specialization || 'General medicine')}</p>
        <span class="tag">${escapeHtml(doctor.phone || 'Contact via hospital')}</span>
      </article>`).join('');
  } catch (error) {
    grid.innerHTML = `<p class="muted">Could not load doctors. Check that the backend is running and database mappings match. ${escapeHtml(error.message)}</p>`;
  }
}

async function loadManagementOptions() {
  const [patients, doctors] = await Promise.all([
    api('/api/admin/patients'),
    api('/api/doctors')
  ]);
  $('appointmentPatient').innerHTML = '<option value="">Select a patient</option>' +
    patients.map((patient) => `<option value="${patient.id}">${escapeHtml(patient.name)} · #${patient.id}</option>`).join('');
  $('appointmentDoctor').innerHTML = '<option value="">Select a doctor</option>' +
    doctors.map((doctor) => `<option value="${doctor.id}">${escapeHtml(doctor.name)} · ${escapeHtml(doctor.specialization)}</option>`).join('');
}

async function showPatients() {
  patientRecords = await api('/api/admin/patients');
  if (!patientRecords.length) {
    $('adminOutput').innerHTML = '<h3>Patients</h3><p class="muted">No patient records found.</p>';
    return;
  }
  const keys = Object.keys(patientRecords[0]);
  $('adminOutput').innerHTML = `<h3>Patients (${patientRecords.length})</h3>
    <div class="table-scroll"><table class="data-table"><thead><tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join('')}<th>Manage</th></tr></thead>
    <tbody>${patientRecords.map((patient) => `<tr>${keys.map((key) => `<td>${escapeHtml(patient[key])}</td>`).join('')}
      <td><button class="button secondary edit-patient" type="button" data-patient-id="${patient.id}">Edit</button></td></tr>`).join('')}</tbody></table></div>`;
}

function clearPatientForm() {
  $('newPatientForm').reset();
  delete $('newPatientForm').dataset.patientId;
  $('patientFormTitle').textContent = 'Register a patient';
  $('savePatient').textContent = 'Save patient';
  $('cancelPatientEdit').hidden = true;
}

async function showAppointments() {
  const appointments = await api('/api/admin/appointments');
  if (!appointments.length) {
    $('adminOutput').innerHTML = '<h3>Appointments</h3><p class="muted">No appointments found.</p>';
    return;
  }
  const keys = Object.keys(appointments[0]);
  $('adminOutput').innerHTML = `<h3>Appointments (${appointments.length})</h3>
    <div class="table-scroll"><table class="data-table"><thead><tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join('')}<th>Update status</th></tr></thead>
    <tbody>${appointments.map((appointment) => `<tr>${keys.map((key) => `<td>${escapeHtml(appointment[key])}</td>`).join('')}
      <td><form class="status-form" data-appointment-id="${appointment.id}">
        <select name="status" aria-label="Appointment status">
          ${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => `<option${appointment.status === status ? ' selected' : ''}>${status}</option>`).join('')}
        </select><button class="button secondary" type="submit">Save</button>
      </form></td></tr>`).join('')}</tbody></table></div>`;
}

$('refreshDoctors').addEventListener('click', loadDoctors);
$('adminLogin').addEventListener('click', async () => {
  const username = $('adminUser').value.trim();
  const password = $('adminPass').value;
  if (!username || !password) {
    toast('Enter your configured admin username and password.');
    return;
  }
  adminAuth = `Basic ${btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
  try {
    await api('/api/admin/patients');
    $('adminLoginForm').hidden = true;
    $('adminPanel').hidden = false;
    $('adminPass').value = '';
    toast('Admin sign-in successful.');
    loadManagementOptions().catch((error) => {
      toast(`Could not load booking options: ${error.message}`);
    });
  } catch (error) {
    adminAuth = '';
    toast(error.message);
  }
});

$('adminLogout').addEventListener('click', () => {
  adminAuth = '';
  $('adminPanel').hidden = true;
  $('adminLoginForm').hidden = false;
  $('adminOutput').replaceChildren();
  clearPatientForm();
  toast('Signed out.');
});

$('newPatientForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const age = $('patientAge').value;
  const patient = {
    name: $('patientName').value.trim(),
    age: age === '' ? null : Number(age),
    gender: $('patientGender').value,
    phone: $('patientPhone').value.trim()
  };
  try {
    const patientId = event.currentTarget.dataset.patientId;
    await api(patientId ? `/api/admin/patients/${patientId}` : '/api/admin/patients', {
      method: patientId ? 'PUT' : 'POST',
      body: JSON.stringify(patient)
    });
    clearPatientForm();
    await loadManagementOptions();
    await showPatients();
    toast(patientId ? 'Patient details updated.' : 'Patient registered.');
  } catch (error) {
    toast(`Could not register patient: ${error.message}`);
  }
});

$('newAppointmentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const appointment = {
    patientId: Number($('appointmentPatient').value),
    doctorId: Number($('appointmentDoctor').value),
    date: $('appointmentDate').value,
    time: $('appointmentTime').value
  };
  try {
    await api('/api/admin/appointments', { method: 'POST', body: JSON.stringify(appointment) });
    event.currentTarget.reset();
    $('appointmentDate').min = new Date().toISOString().slice(0, 10);
    await showAppointments();
    toast('Appointment booked.');
  } catch (error) {
    toast(`Could not book appointment: ${error.message}`);
  }
});

$('loadAppointments').addEventListener('click', async () => {
  try {
    await showAppointments();
  } catch (error) {
    toast(error.message);
  }
});

$('loadPatients').addEventListener('click', async () => {
  try {
    await showPatients();
  } catch (error) {
    toast(error.message);
  }
});

$('adminOutput').addEventListener('submit', async (event) => {
  const form = event.target.closest('.status-form');
  if (!form) return;
  event.preventDefault();
  try {
    await api(`/api/admin/appointments/${form.dataset.appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: new FormData(form).get('status') })
    });
    await showAppointments();
    toast('Appointment status updated.');
  } catch (error) {
    toast(`Could not update appointment: ${error.message}`);
  }
});

$('adminOutput').addEventListener('click', (event) => {
  const button = event.target.closest('.edit-patient');
  if (!button) return;
  const patient = patientRecords.find((record) => record.id === Number(button.dataset.patientId));
  if (!patient) {
    toast('Patient record is no longer available. Reload the patient list.');
    return;
  }
  const form = $('newPatientForm');
  form.dataset.patientId = patient.id;
  $('patientName').value = patient.name || '';
  $('patientAge').value = patient.age ?? '';
  $('patientGender').value = patient.gender || '';
  $('patientPhone').value = patient.phone || '';
  $('patientFormTitle').textContent = `Edit patient #${patient.id}`;
  $('savePatient').textContent = 'Update patient';
  $('cancelPatientEdit').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('cancelPatientEdit').addEventListener('click', clearPatientForm);

$('appointmentDate').min = new Date().toISOString().slice(0, 10);
loadDoctors();
