import http from "k6/http";
import { Rate } from "k6/metrics";
import { check, sleep } from "k6";

const failureRate = new Rate("check_failure_rate");

const params = {
  hostname: __ENV.HOSTNAME || "https://go.d1m.dev",
  maxTargetCount: __ENV.MAX_TARGET_COUNT || 5,
  httpRequestDurationThreshold: __ENV.HTTP_REQUEST_DURATION_THRESHOLD || 1500
}

export let options = {
  stages: [
    { target: params.maxTargetCount, duration: "1m" },
    { target: params.maxTargetCount, duration: "3m30s" },
    { target: 0, duration: "30s" }
  ],
  thresholds: {
    "http_req_duration": [`p(95)<${params.httpRequestDurationThreshold}`],
    "check_failure_rate": [
      "rate<0.01",
      { threshold: "rate<=0.05", abortOnFail: true },
    ],
  },
};

export default function () {
  const response = http.get(`${params.hostname}/a/b/c/d/e/g/s/f/w/a/f/s/c`);

  const checkRes = check(response, {
    "http2 is used": res => res.proto === "HTTP/2.0",
    "status is 200": res => res.status === 200,
  });

  failureRate.add(!checkRes);

  /* Random sleep between 2s and 5s */
  sleep(Math.random() * 3 + 2);
};
