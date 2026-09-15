import { db, auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginSec = document.getElementById('login-section');
const dashSec = document.getElementById('dashboard-section');

// Cek Status Login
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSec.style.display = 'none';
        dashSec.style.display = 'block';
        loadExams();
        loadResults();
    } else {
        loginSec.style.display = 'block';
        dashSec.style.display = 'none';
    }
});

// Login
document.getElementById('form-login-guru').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (error) {
        alert("Email atau password salah!");
    }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

// Buat Ujian Baru
document.getElementById('btn-buat-ujian').addEventListener('click', async () => {
    const judul = document.getElementById('judul-ujian').value;
    const kode = document.getElementById('kode-ujian-baru').value;
    const durasi = parseInt(document.getElementById('durasi-ujian').value);
    if(!judul || !kode || !durasi) return alert("Isi semua data ujian!");
    
    await addDoc(collection(db, "exams"), { judul, kode, durasi, aktif: true });
    alert("Ujian berhasil dibuat!");
    loadExams();
});

// Load daftar ujian ke dropdown pembuatan soal
async function loadExams() {
    const snapshot = await getDocs(collection(db, "exams"));
    const select = document.getElementById('pilih-ujian-soal');
    select.innerHTML = '<option value="">-- Pilih Ujian --</option>';
    snapshot.forEach(doc => {
        select.innerHTML += `<option value="${doc.id}">${doc.data().kode} - ${doc.data().judul}</option>`;
    });
}

// Simpan Soal
document.getElementById('btn-simpan-soal').addEventListener('click', async () => {
    const examId = document.getElementById('pilih-ujian-soal').value;
    if(!examId) return alert("Pilih ujian terlebih dahulu!");
    
    await addDoc(collection(db, "questions"), {
        examId: examId,
        pertanyaan: document.getElementById('pertanyaan').value,
        A: document.getElementById('pil-a').value,
        B: document.getElementById('pil-b').value,
        C: document.getElementById('pil-c').value,
        D: document.getElementById('pil-d').value,
        jawabanBenar: document.getElementById('kunci-jawaban').value
    });
    alert("Soal berhasil ditambahkan!");
    
    // Kosongkan form
    document.getElementById('pertanyaan').value = "";
    document.getElementById('pil-a').value = "";
    document.getElementById('pil-b').value = "";
    document.getElementById('pil-c').value = "";
    document.getElementById('pil-d').value = "";
});

// Muat Hasil Siswa
async function loadResults() {
    const tbody = document.querySelector('#tabel-hasil tbody');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';
    
    const snapshot = await getDocs(collection(db, "submissions"));
    tbody.innerHTML = '';
    
    snapshot.forEach(d => {
        const data = d.data();
        let statusHtml = data.pelanggaran > 0 
            ? `<span style="color:red; font-weight:bold;">Terdapat ${data.pelanggaran}x Peringatan Tab Keluar</span>`
            : `<span style="color:green;">Aman</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${data.nama} <br><small>NIS: ${data.nis}</small></td>
                <td>${data.kelas}</td>
                <td>${data.kodeUjian}</td>
                <td>${data.benar}</td>
                <td>${data.salah}</td>
                <td style="font-weight:bold; font-size:16px;">${data.nilai}</td>
                <td>${statusHtml}</td>
                <td><button class="btn btn-danger" onclick="hapusSiswa('${d.id}')">Reset Ujian</button></td>
            </tr>
        `;
    });
}
document.getElementById('btn-refresh').addEventListener('click', loadResults);

// Reset (Hapus data siswa agar bisa mengerjakan lagi)
window.hapusSiswa = async (id) => {
    if(confirm("Yakin ingin menghapus data siswa ini agar ia bisa mengulang ujian?")) {
        await deleteDoc(doc(db, "submissions", id));
        loadResults();
        alert("Data berhasil direset. Siswa sudah bisa login kembali.");
    }
}
