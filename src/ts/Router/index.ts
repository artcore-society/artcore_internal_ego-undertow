import { createRouter, createWebHistory } from 'vue-router';

export default createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: () => import('../Pages/Home.vue')
		}
	]
});
