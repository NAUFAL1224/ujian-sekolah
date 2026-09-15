import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById('form-login-siswa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "Memeriksa data...";
    
    const nama = document.getElementById('nama').value;
    const nis = document.getElementById('nis').value;
    const kelas = document.getElementById('kelas').value;
    const kodeUjian = document.getElementById('kode-ujian').value;
    const errorMsg = document.getElementById('pesan-error');

    try {
        // Cek apakah ujian ada
        const qUjian = query(collection(db, "exams"), where("kode", "==", kodeUjian));
        const examDocs = await getDocs(qUjian);
        
        if (examDocs.empty) {
            errorMsg.innerText = "Kode ujian tidak ditemukan atau belum aktif.";
            btn.innerText = "Mulai Ujian";
            return;
        }

        const examData = examDocs.docs[0].data();
        if(!examData.aktif) {
             errorMsg.innerText = "Ujian ini sedang dinonaktifkan oleh guru.";
             btn.innerText = "Mulai Ujian";
             return;
        }

        // Cek apakah siswa sudah pernah mengerjakan
        const identitasUnik = `${kodeUjian}_${nis}`;
        const qCek = query(collection(db, "submissions"), where("identitasUnik", "==", identitasUnik));
        const cekDocs = await getDocs(qCek);

        if (!cekDocs.empty) {
            errorMsg.innerText = "Akses ditolak. Anda sudah pernah mengerjakan ujian ini.";
            btn.innerText = "Mulai Ujian";
            return;
        }

        // Simpan ke LocalStorage dan pindah halaman
        const studentData = { nama, nis, kelas, kodeUjian, identitasUnik, examId: examDocs.docs[0].id, durasi: examData.durasi };
        localStorage.setItem('studentSession', JSON.stringify(studentData));
        localStorage.removeItem('studentAnswers'); // Reset jawaban lama
        
        window.location.href = "ujian.html";
    } catch (error) {
        errorMsg.innerText = "Terjadi kesalahan sistem. Cek koneksi internet.";
        console.error(error);
        btn.innerText = "Mulai Ujian";
    }
});
