 ---                                                                                                                                       Logging Stack — Complete
                                                                                                                                            3 New Services Added                                                                                                                    

  ┌────────────────────┬────────────┬──────────────────────────────────────────┐
  │      Service       │    Port    │                   Role                   │
  ├────────────────────┼────────────┼──────────────────────────────────────────┤
  │ Elasticsearch 8.12 │ 9200       │ Stores and indexes all logs              │
  ├────────────────────┼────────────┼──────────────────────────────────────────┤
  │ Logstash 8.12      │ 5000 (TCP) │ Receives logs from Python, ships to ES   │
  ├────────────────────┼────────────┼──────────────────────────────────────────┤
  │ Grafana 10.3       │ 3000       │ Visualizes logs with pre-built dashboard │
  └────────────────────┴────────────┴──────────────────────────────────────────┘

  How It Works (Data Flow)

  Python Service → TCP:5000 → Logstash → Elasticsearch → Grafana

  Each Python service has a LogstashTCPHandler that sends structured JSON logs directly to Logstash over TCP. No log files, no Filebeat   
  needed — works on any OS.

  What Gets Logged Automatically

  - Every HTTP request: method, path, status code, latency (ms)
  - Service startup/shutdown events
  - Log levels: DEBUG, INFO, WARNING, ERROR
  - Request IDs for tracing

  Access Grafana

  Open http://localhost:3000 → Login: admin / admin123

  The "Microservices Logs" dashboard is pre-loaded with:
  - Live log stream
  - Log volume over time (by level)
  - Log level donut chart (INFO/WARNING/ERROR/DEBUG)
  - Logs per service bar chart
  - Error rate per service over time
  - Summary stats (total errors, warnings, active services)
  - Recent HTTP requests table

  Test the Pipeline