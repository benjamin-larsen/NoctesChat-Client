export default {
  methods: {
    goBack() {
      window.history.back();
    },

    goHome() {
      this.$router.navigate("/")
    }
  },

  render() {
    return <>
    <div className="page-center">
      <h2 style="margin-bottom: 0; font-weight: 600;">Error 404</h2>
      <h3 style="margin-top: 0; font-weight: 500;">Page not Found</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
        <button className="btn-primary" onClick={this.methods.goBack}>Go back</button>
        <button className="btn-primary" onClick={this.methods.goHome}>Gå to dashboard</button>
      </div>
    </div>
    </>
  }
}