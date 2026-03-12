import axios from 'axios'

export const serviceClient = axios.create({
  headers: { 'X-Internal': 'true' },
  timeout: 5000,
})
