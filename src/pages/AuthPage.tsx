import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { AuthApiError, loginAccount, registerAccount, type AuthResult } from "../api/authApi";

type Mode = "register" | "login";

interface AuthPageProps {
  onAuthed: (result: AuthResult) => void;
}

export function AuthPage({ onAuthed }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>("register");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    const trimmedPhone = phone.trim();
    if (!/^\d{6,20}$/.test(trimmedPhone)) {
      setError("请输入有效的手机号。");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位。");
      return;
    }
    setLoading(true);
    try {
      const result = isRegister
        ? await registerAccount(trimmedPhone, password)
        : await loginAccount(trimmedPhone, password);
      onAuthed(result);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "操作失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page page-scroll dt-page auth-page">
      <div className="page-content dt-content auth-content">
        <div className="auth-brand">
          <span className="dt-brand-mark" />
          DreamTwin
        </div>

        <div className="auth-hero">
          <h1>{isRegister ? "创建你的 DreamTwin" : "欢迎回来"}</h1>
          <p>{isRegister ? "先注册账号,再创建专属于你的 AI 分身。" : "登录后继续你的关系预演。"}</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>手机号</span>
            <input
              autoComplete="tel"
              inputMode="numeric"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              type="tel"
              value={phone}
            />
          </label>
          <label className="auth-field">
            <span>密码</span>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <PrimaryButton icon={<ArrowRight size={18} />} type="submit" disabled={loading}>
            {loading ? "请稍候…" : isRegister ? "注册并创建分身" : "登录"}
          </PrimaryButton>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setError(null);
          }}
          type="button"
        >
          {isRegister ? "已有账号?去登录" : "还没有账号?去注册"}
        </button>

        <p className="dt-note auth-note">仅需手机号 + 密码即可开始,无需短信。账号信息会安全保存。</p>
      </div>
    </section>
  );
}
