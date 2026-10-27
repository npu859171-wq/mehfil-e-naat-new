import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "./firebase";

const ADMIN_UID = "hSWjQtY3JAhZYJjA9IvNohxj3Hg1";

const emptyForm = {
  title: "",
  poet: "",
  category: "نعت",
  text: ""
};

export default function AdminPanel({ onClose }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [naats, setNaats] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function requireFreshLogin() {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Previous session sign-out failed:", error);
      } finally {
        if (active) {
          setUser(null);
          setChecking(false);
        }
      }
    }

    requireFreshLogin();
    return () => {
      active = false;
    };
  }, []);

  const isAdmin = user?.uid === ADMIN_UID;

  async function loadNaats() {
    setBusy(true);
    setMessage("");

    try {
      const snapshot = await getDocs(collection(db, "naats"));
      setNaats(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      );
    } catch (error) {
      setMessage("نعتیں لوڈ نہیں ہوئیں: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadNaats();
  }, [isAdmin]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (result.user.uid !== ADMIN_UID) {
        await signOut(auth);
        setUser(null);
        setMessage("یہ اکاؤنٹ ایڈمن کے لیے مجاز نہیں ہے۔");
      } else {
        setUser(result.user);
      }
    } catch (error) {
      setMessage("لاگ اِن نہیں ہوا: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("اجازت نہیں ہے۔");
      return;
    }

    if (!form.title.trim() || !form.text.trim()) {
      setMessage("نعت کا عنوان اور متن لازمی ہیں۔");
      return;
    }

    setBusy(true);
    setMessage("");

    const data = {
      title: form.title.trim(),
      poet: form.poet.trim(),
      category: form.category.trim() || "نعت",
      text: form.text.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "naats", editingId), data);
        setMessage("نعت کامیابی سے تبدیل ہوگئی۔");
      } else {
        await addDoc(collection(db, "naats"), {
          ...data,
          createdAt: new Date().toISOString()
        });
        setMessage("نئی نعت محفوظ ہوگئی۔");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadNaats();
    } catch (error) {
      setMessage("محفوظ نہیں ہوئی: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) return;
    if (!window.confirm("کیا آپ واقعی یہ نعت حذف کرنا چاہتے ہیں؟")) return;

    setBusy(true);
    setMessage("");

    try {
      await deleteDoc(doc(db, "naats", id));
      setMessage("نعت حذف ہوگئی۔");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await loadNaats();
    } catch (error) {
      setMessage("حذف نہیں ہوئی: " + error.message);
    } finally {
      setBusy(false);
    }
  }

  const pageStyle = {
    maxWidth: 760,
    margin: "24px auto",
    padding: 20,
    color: "#f5e7c1",
    background: "#17171d",
    border: "1px solid #b88a2e",
    borderRadius: 16,
    direction: "rtl"
  };

  const fieldStyle = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    margin: "8px 0 14px",
    color: "#fff",
    background: "#0b0b0f",
    border: "1px solid #66552f",
    borderRadius: 8,
    font: "inherit"
  };

  const buttonStyle = {
    padding: "10px 16px",
    margin: "4px",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
    font: "inherit"
  };

  if (checking) {
    return <section style={pageStyle}>اکاؤنٹ چیک ہو رہا ہے...</section>;
  }

  return (
    <section style={pageStyle}>
      <button
        style={buttonStyle}
        onClick={onClose}
        type="button"
      >
        ← ویب سائٹ پر واپس جائیں
      </button>

      <h2>محفلِ نعت — ایڈمن پینل</h2>

      {message && (
        <p role="status" style={{ overflowWrap: "anywhere" }}>
          {message}
        </p>
      )}

      {!isAdmin ? (
        <form onSubmit={handleLogin}>
          <label>
            ایڈمن ای میل
            <input
              style={fieldStyle}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            پاس ورڈ
            <input
              style={fieldStyle}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button style={buttonStyle} disabled={busy} type="submit">
            {busy ? "انتظار کریں..." : "ایڈمن لاگ اِن"}
          </button>
        </form>
      ) : (
        <>
          <p>ایڈمن لاگ اِن ہے: {user.email}</p>

          <form onSubmit={handleSave}>
            <label>
              نعت کا عنوان
              <input
                style={fieldStyle}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
              />
            </label>

            <label>
              شاعر یا نعت خواں
              <input
                style={fieldStyle}
                value={form.poet}
                onChange={(e) =>
                  setForm({ ...form, poet: e.target.value })
                }
              />
            </label>

            <label>
              قسم
              <select
                style={fieldStyle}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="نعت">نعت</option>
                <option value="سلام">سلام</option>
                <option value="منقبت">منقبت</option>
                <option value="حمد">حمد</option>
              </select>
            </label>

            <label>
              مکمل نعت کا متن
              <textarea
                style={{ ...fieldStyle, minHeight: 180 }}
                value={form.text}
                onChange={(e) =>
                  setForm({ ...form, text: e.target.value })
                }
                required
              />
            </label>

            <button style={buttonStyle} disabled={busy} type="submit">
              {busy
                ? "محفوظ ہو رہا ہے..."
                : editingId
                  ? "تبدیلی محفوظ کریں"
                  : "نئی نعت شامل کریں"}
            </button>

            {editingId && (
              <button
                style={buttonStyle}
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                ترمیم منسوخ کریں
              </button>
            )}
          </form>

          <hr />

          <h3>ڈیٹابیس میں موجود نعتیں ({naats.length})</h3>

          <button
            style={buttonStyle}
            type="button"
            disabled={busy}
            onClick={loadNaats}
          >
            فہرست تازہ کریں
          </button>

          {naats.map((naat) => (
            <article
              key={naat.id}
              style={{
                border: "1px solid #66552f",
                borderRadius: 10,
                padding: 12,
                marginTop: 12
              }}
            >
              <h4>{naat.title}</h4>
              <p>{naat.poet}</p>
              <button
                style={buttonStyle}
                type="button"
                onClick={() => {
                  setEditingId(naat.id);
                  setForm({
                    title: naat.title || "",
                    poet: naat.poet || "",
                    category: naat.category || "نعت",
                    text: naat.text || ""
                  });
                }}
              >
                ترمیم کریں
              </button>
              <button
                style={buttonStyle}
                type="button"
                disabled={busy}
                onClick={() => handleDelete(naat.id)}
              >
                حذف کریں
              </button>
            </article>
          ))}

          <button
            style={buttonStyle}
            type="button"
            onClick={async () => {
              await signOut(auth);
              setMessage("آپ لاگ آؤٹ ہوگئے ہیں۔");
            }}
          >
            لاگ آؤٹ
          </button>
        </>
      )}
    </section>
  );
}
