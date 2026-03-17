import * as PIXI from 'pixi.js'
import proj4 from 'proj4'
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

window.PIXI = PIXI
window.proj4 = proj4

createApp(App).mount('#app')
