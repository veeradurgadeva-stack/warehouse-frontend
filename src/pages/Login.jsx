import {useState} from "react";
import bg from "../assets/warehouse-clean-bg.jpg";

export default function Login({onLogin}){

  const [u,setU]=useState("");
  const [p,setP]=useState("");
  const [r,setR]=useState("ADMIN");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async e=>{

    e.preventDefault();
    setError("");

    if(!u.trim() || !p.trim()){
      setError("Enter username and password");
      return;
    }

    setLoading(true);

    try{

      const success=await onLogin(
        u.trim(),
        p,
        r
      );

      if(!success){
        setError(
          "Invalid username, password or role"
        );
      }

    }catch(error){

      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to backend"
      );

    }finally{

      setLoading(false);

    }
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage:`url(${bg})`
      }}
    >

      <div className="login-card">

        <div className="login-logo">

          <div className="building">

            <div className="building-roof"/>

            <div className="building-body">
              <span/>
              <b/>
              <span/>
            </div>

          </div>

        </div>

        <h1>Warehouse Management</h1>

        <p className="login-subtitle">
          Sign in to continue
        </p>

        <form onSubmit={submit}>

          <label>
            Username

            <div className="login-input">

              <span>◉</span>

              <input
                autoComplete="username"
                value={u}
                onChange={e=>setU(e.target.value)}
                placeholder="Username"
              />

            </div>

          </label>

          <label>
            Password

            <div className="login-input">

              <span>🔒</span>

              <input
                autoComplete="current-password"
                type={show?"text":"password"}
                value={p}
                onChange={e=>setP(e.target.value)}
                placeholder="Password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={()=>setShow(!show)}
              >
                {show?"🙈":"👁"}
              </button>

            </div>

          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="role-select">

            <button
              type="button"
              className={r==="ADMIN"?"selected":""}
              onClick={()=>setR("ADMIN")}
            >
              Admin
            </button>

            <button
              type="button"
              className={r==="STAFF"?"selected":""}
              onClick={()=>setR("STAFF")}
            >
              Staff
            </button>

          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}