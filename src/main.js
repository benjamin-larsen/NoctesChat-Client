import { App, root, usePlugin } from 'noctes.jsx'
import './style.css'
import { auth } from './services/auth.js'
import { request } from './services/http.js'

import router, { RouterView } from 'noctes.jsx-router'

import LoginPage from './components/LoginPage.jsx'
import RegisterPage from './components/RegisterPage.jsx'

import MainView from './components/MainView.jsx'
import CreateChannel from './components/CreateChannel.jsx'
import Page404 from './components/404Page.jsx'
import Channel from './components/Channel.jsx'

usePlugin(router, {
  routes: [
    {
      path: "/login",
      component: LoginPage,
      meta: { excludeAuth: true }
    },
    {
      path: "/register",
      component: RegisterPage,
      meta: { excludeAuth: true }
    },
    {
      path: "/",
      component: MainView,
      children: [
        {
          path: "",
          component: CreateChannel
        },
        {
          path: "channels/:id",
          component: Channel
        },
        {
          path: "*",
          component: Page404
        }
      ],
      meta: { requireAuth: true }
    }
  ],

  processRoute(_, to) {
    if (to.meta.requireAuth && !auth.value) return "/login";
    if (to.meta.excludeAuth && auth.value) return "/";
  }
})

new App(
  root(RouterView, "#app")
).render()
