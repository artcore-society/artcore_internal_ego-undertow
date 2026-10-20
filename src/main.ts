import { createApp } from 'vue';
import './styles/app.scss';
import router from './ts/Router';
import App from './ts/Layouts/AppLayout.vue';

createApp(App).use(router).mount('#app');
