import { db } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const session = JSON.parse(localStorage.getItem('studentSession'));
if (!session) window.location.href = "index.html";

document.getElementById('display-nama').innerText = session.nama;
document.getElementById('display-kelas').innerText = session.kelas;

let questions = [];
let currentQuestionIndex = 0;
let answers = JSON.parse(localStorage.getItem('studentAnswers')) || {};
let pelanggaran = 0;

// SISTEM ANTI CURANG (Browser Visibility)
document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        pelanggaran++;
        document.getElementById('warning-modal').style.display = 'flex';
        // Catat ke database
        await addDoc(collection(db, "activity_logs"), {
            identitasUnik: session.identitasUnik,
            nama: session.nama,
            nis: session.nis,
            kelas: session.kelas,
            kodeUjian: session.kodeUjian,
            waktu: new Date().toLocaleString('id-ID'),
            aktivitas: "Keluar dari tab/browser kehilangan fokus",
            jumlahPelanggaran: pelanggaran
        });
    }
});

// Ambil Soal
async function loadQuestions() {
    const q = query(collection(db, "questions"), where("examId", "==", session.examId));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        questions.push({ id: doc.id, ...doc.data() });
    });
    
    // Randomisasi urutan soal
    questions.sort(() => Math.random() - 0.5);
    
    document.getElementById('total-num').innerText = questions.length;
    mulaiTimer();
    tampilSoal();
}

function tampilSoal() {
    if(questions.length === 0) return;
    const q = questions[currentQuestionIndex];
    document.getElementById('current-num').innerText = currentQuestionIndex + 1;
    document.getElementById('pertanyaan').innerText = q.pertanyaan;
    
    const container = document.getElementById('pilihan-jawaban');
    container.innerHTML = '';
    
    const options = [
        { key: 'A', text: q.A }, { key: 'B', text: q.B },
        { key: 'C', text: q.C }, { key: 'D', text: q.D }
    ];

    options.forEach(opt => {
        const checked = answers[q.id] === opt.key ? 'checked' : '';
        container.innerHTML += `
            <label>
                <input type="radio" name="jawaban" value="${opt.key}" ${checked} onchange="simpanJawaban('${q.id}', '${opt.key}')">
                <span>${opt.key}. ${opt.text}</span>
            </label>
        `;
    });

    document.getElementById('btn-prev').style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('btn-next').style.display = 'none';
        document.getElementById('btn-selesai').style.display = 'inline-block';
    } else {
        document.getElementById('btn-next').style.display = 'inline-block';
        document.getElementById('btn-selesai').style.display = 'none';
    }
}

window.simpanJawaban = function(questionId, answerKey) {
    answers[questionId] = answerKey;
    localStorage.setItem('studentAnswers', JSON.stringify(answers));
}

document.getElementById('btn-next').addEventListener('click', () => { currentQuestionIndex++; tampilSoal(); });
document.getElementById('btn-prev').addEventListener('click', () => { currentQuestionIndex--; tampilSoal(); });

// PENGIRIMAN & PENILAIAN OTOMATIS
document.getElementById('btn-selesai').addEventListener('click', () => {
    if(confirm('Yakin ingin menyelesaikan ujian? Jawaban tidak bisa diubah lagi.')) {
        submitUjian();
    }
});

async function submitUjian() {
    document.getElementById('btn-selesai').innerText = "Memproses...";
    let benar = 0;
    
    // Hitung Nilai
    questions.forEach(q => {
        if (answers[q.id] === q.jawabanBenar) benar++;
    });
    
    const salah = questions.length - benar;
    const nilaiAkhir = Math.round((benar / questions.length) * 100);

    // Simpan ke Firestore
    try {
        await addDoc(collection(db, "submissions"), {
            identitasUnik: session.identitasUnik,
            nama: session.nama,
            nis: session.nis,
            kelas: session.kelas,
            kodeUjian: session.kodeUjian,
            benar: benar,
            salah: salah,
            nilai: nilaiAkhir,
            pelanggaran: pelanggaran,
            waktuSelesai: serverTimestamp()
        });
        
        localStorage.removeItem('studentSession');
        localStorage.removeItem('studentAnswers');
        localStorage.removeItem('endTime');
        
        alert(`Ujian Selesai!\nJawaban Benar: ${benar}\nNilai Anda: ${nilaiAkhir}`);
        window.location.replace('index.html');
    } catch (e) {
        alert("Gagal mengirim! Tolong panggil guru Anda. JANGAN TUTUP HALAMAN INI.");
        console.error(e);
    }
}

// TIMER
function mulaiTimer() {
    let endTime = localStorage.getItem('endTime');
    if (!endTime) {
        endTime = new Date().getTime() + (session.durasi * 60000);
        localStorage.setItem('endTime', endTime);
    }
    
    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance < 0) {
            clearInterval(timerInterval);
            alert("Waktu habis! Jawaban akan dikirim otomatis.");
            submitUjian();
            return;
        }
        
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById('timer-display').innerText = `Sisa Waktu: ${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
}

loadQuestions();
