let db;
let idSedangDiedit = null;

// Menyimpan database ke localStorage
function simpanDatabase() {
    const data = db.export();
    let binary = "";

    data.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    localStorage.setItem("riwayatDB", btoa(binary));
}

// Menghubungkan database
async function initDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `sqlite/${file}`
        });

        const dataLama = localStorage.getItem("riwayatDB");

        if (dataLama) {
            const bytes = Uint8Array.from(
                atob(dataLama),
                c => c.charCodeAt(0)
            );
            db = new SQL.Database(bytes);
        } else {
            db = new SQL.Database();
        }

        db.run(`
            CREATE TABLE IF NOT EXISTS riwayat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama_sekolah TEXT NOT NULL,
                tahun_masuk INTEGER NOT NULL,
                tahun_lulus INTEGER NOT NULL,
                keterangan TEXT
            )
        `);

        simpanDatabase();
        tampilkanData();

        console.log("Database berhasil terhubung!");

    } catch (error) {
        console.error("Database gagal:", error);
        alert("Database gagal dimuat!");
    }
}

// Menampilkan data
function tampilkanData() {
    const hasil = db.exec("SELECT * FROM riwayat");
    const tabel = document.getElementById("daftarRiwayat");

    tabel.innerHTML = "";

    if (hasil.length === 0) {
        tabel.innerHTML = `
            <tr><td colspan="6">Belum ada data</td></tr>
        `;
        return;
    }

    hasil[0].values.forEach((data, index) => {
        tabel.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${data[1]}</td>
                <td>${data[2]}</td>
                <td>${data[3]}</td>
                <td>${data[4] || "-"}</td>
                <td>
                    <button class="edit" onclick="editData(${data[0]})">Edit</button>
                    <button class="hapus" onclick="hapusData(${data[0]})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

// Tambah dan edit data
document.getElementById("formRiwayat").addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = document.getElementById("nama_sekolah").value;
    const masuk = Number(document.getElementById("tahun_masuk").value);
    const lulus = Number(document.getElementById("tahun_lulus").value);
    const keterangan = document.getElementById("keterangan").value;

    if (idSedangDiedit !== null) {
        db.run(
            `UPDATE riwayat
             SET nama_sekolah = ?, tahun_masuk = ?,
                 tahun_lulus = ?, keterangan = ?
             WHERE id = ?`,
            [nama, masuk, lulus, keterangan, idSedangDiedit]
        );

        idSedangDiedit = null;
    } else {
        db.run(
            `INSERT INTO riwayat
             (nama_sekolah, tahun_masuk, tahun_lulus, keterangan)
             VALUES (?, ?, ?, ?)`,
            [nama, masuk, lulus, keterangan]
        );
    }

    simpanDatabase();
    this.reset();
    tampilkanData();
});

// Menghapus data
function hapusData(id) {
    if (confirm("Yakin ingin menghapus data?")) {
        db.run("DELETE FROM riwayat WHERE id = ?", [id]);
        simpanDatabase();
        tampilkanData();
    }
}

// Mengedit data
function editData(id) {
    const hasil = db.exec(
        "SELECT * FROM riwayat WHERE id = ?", [id]
    );

    if (hasil.length === 0) return;

    const data = hasil[0].values[0];

    document.getElementById("nama_sekolah").value = data[1];
    document.getElementById("tahun_masuk").value = data[2];
    document.getElementById("tahun_lulus").value = data[3];
    document.getElementById("keterangan").value = data[4] || "";

    idSedangDiedit = id;
}

// Download database
function downloadDatabase() {
    const data = db.export();
    const blob = new Blob([data], {
        type: "application/x-sqlite3"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "riwayat.db";
    link.click();

    URL.revokeObjectURL(url);
}

initDatabase();