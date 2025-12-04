import { ref, watch, globalProperties } from "noctes.jsx"
import { RouterLink } from "noctes.jsx-router";
import Input from './Input.jsx'
import { request } from "../services/http.js";
import { setAuth } from "../services/auth.js";

function validate(email, password) {
  if (email.length < 1) return "You must specify a Email Address";
  if (!/^[^@]+@[^@]+$/.test(email)) return "Invalid Email Address";
  if (email.length > 254) return "Email Address is too long (> 254)";

  if (password.length < 1) return "You must specify a password";

  return null;
}

export default {
  methods: {
    async processLogin() {
      const email = this.email.value;
      const password = this.password.value;

      if (!!validate(email, password)) return;

      this.loading.value = true;

      const resp = await request({
        url: "/auth/login",
        method: "POST",
        body: {
          email,
          password
        }
      })

      if (resp.status !== 200 || !resp.body.token) {
        this.loading.value = false;
        this.currentError.value = resp.body.error || "Unknown Error"
        return;
      }

      setAuth(resp.body.token);
    }
  },

  onCreated(ctx) {
    ctx.email = ref("");
    ctx.password = ref("");
    
    ctx.currentError = ref(null);
    ctx.loading = ref(false);

    watch([ctx.email, ctx.password], (next) => {
      ctx.currentError.value = validate(next[0], next[1]);
    }, { immediate: true })
  },

  render(ctx) {
    return <>
      <div className="page-center">
        <div className="authCard">
          <h1 className="m-0 mb-8 text-25">Login</h1>
          <Input disabled={ctx.loading.value} nModel={ctx.email} label="Email Address" type="email" />
          <Input disabled={ctx.loading.value} nModel={ctx.password} label="Password" type="password" />
          <button onClick={ctx.processLogin} disabled={ctx.loading.value || !!validate(ctx.email.value, ctx.password.value)} class="btn-primary">Login</button>
          <Transition>
            {
              ctx.loading.value ?
              <span class="text-14" key="loading">Loading...</span> :
              ctx.currentError.value ?
              <span class="text-14 text-red" key={`error-${ctx.currentError.value}`}>${ctx.currentError.value}</span>
              : null
            }
          </Transition>
          <div class="text-14">Don't have an account? <RouterLink to="/register">Create one here</RouterLink></div>
        </div>
      </div>
    </>
  }
}