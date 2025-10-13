import * as PDFJS from 'pdfjs-dist'
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min?url'
PDFJS.GlobalWorkerOptions.workerSrc = PDFWorker;
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
