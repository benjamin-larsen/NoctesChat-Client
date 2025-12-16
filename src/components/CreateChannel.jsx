import { reactive, ref, watchEffect } from "noctes.jsx"
import Input from "./Input.jsx"
import TagInput from "./TagInput.jsx";
import { request, getUserByUsername } from "../services/http.js"
import { authUser } from "../services/auth.js";
import { channels } from "../services/channels.js";

async function resolveTag(tag) {
  const authId = authUser.value && authUser.value.id;
  const authUsername = authUser.value && authUser.value.username;

  if (tag.value === authUsername) {
    tag.status = "error";
    tag.error = "You can't specify yourself"
    return;
  }

  let {user, error} = await getUserByUsername(tag.value)

  if (user && user.id === authId) {
    tag.status = "error";
    tag.error = "You can't specify yourself"
    return;
  }

  if (user) {
    tag.status = "loaded";
    tag.id = user.id;
  } else {
    tag.status = "error";
    tag.error = error;
  }
}

function validate(name, usernames) {
  if (name.length < 1) return "You must specify a channel name";
  if (name.length < 3 || name.length > 50) return "Channel Name must be between 3 and 50 characters long";

  if (usernames.length < 1) return "You must specify atleast one member";

  for (const tag of usernames) {
    if (tag.status !== "loaded") return true;
  }

  return false;
}

export default {
  methods: {
    async processCreate() {
      const name = this.name.value;
      let members = this.usernames;

      if (!!validate(name, members)) return;

      members = members.map(m => m.id);
      this.loading.value = true;

      const resp = await request({
        url: "/channels",
        method: "POST",
        body: {
          name,
          members
        },
        includeAuth: true
      })

      if (resp.status !== 200) {
        this.loading.value = false;
        this.currentError.value = resp.body.error || "Unknown Error"
        return;
      }

      if (!channels.has(resp.body.id)) channels.set(resp.body.id, {...resp.body, members: new Map()});

      this.$router.navigate(`/channels/${resp.body.id}`);
    }
  },

  onCreated(ctx) {
    ctx.name = ref("");
    ctx.usernames = reactive([]);

    ctx.currentError = ref(null);
    ctx.loading = ref(false);

    watchEffect(() => {
      const err = validate(ctx.name.value, ctx.usernames);
      ctx.currentError.value = typeof err === "string" ? err : null;
    })
  },

  render(ctx) {
    return <>
      <div className="page-center">
        <div className="mainCard">
          <h1 className="m-0 mb-8 text-25">Create Channel</h1>
          <Input disabled={ctx.loading.value} label="Channel Name" nModel={ctx.name} />
          <TagInput disabled={ctx.loading.value} label="Members" nModel={ctx.usernames} resolve={resolveTag} />
          <button disabled={ctx.loading.value || !!validate(ctx.name.value, ctx.usernames)} onClick={ctx.processCreate} class="btn-primary">Create Channel</button>
          <Transition>
            {
              ctx.loading.value ?
              <span class="text-14" key="loading">Loading...</span> :
              ctx.currentError.value ?
              <span class="text-14 text-red" key={`error-${ctx.currentError.value}`}>${ctx.currentError.value}</span>
              : null
            }
          </Transition>
        </div>
      </div>
    </>
  }
}