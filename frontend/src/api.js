import axios from 'axios'
const BASE = import.meta.env.VITE_API_URL || 'https://flight-ops-analytics.onrender.com'
export const api = {
  health:      ()     => axios.get(`${BASE}/health`).then(r=>r.data),
  stats:       ()     => axios.get(`${BASE}/stats`).then(r=>r.data),
  overview:    (p)    => axios.get(`${BASE}/overview`,       {params:p}).then(r=>r.data),
  otp:         (p)    => axios.get(`${BASE}/otp`,            {params:p}).then(r=>r.data),
  otpByAirline:(p)    => axios.get(`${BASE}/otp-by-airline`, {params:p}).then(r=>r.data),
  delays:      (p)    => axios.get(`${BASE}/delays`,         {params:p}).then(r=>r.data),
  delayCauses: (p)    => axios.get(`${BASE}/delays-by-cause`,{params:p}).then(r=>r.data),
  turnaround:  (p)    => axios.get(`${BASE}/turnaround`,     {params:p}).then(r=>r.data),
  routes:      (p)    => axios.get(`${BASE}/routes`,         {params:p}).then(r=>r.data),
  hourly:      (p)    => axios.get(`${BASE}/hourly-pattern`, {params:p}).then(r=>r.data),
  trends:      (p)    => axios.get(`${BASE}/trends`,         {params:p}).then(r=>r.data),
}
