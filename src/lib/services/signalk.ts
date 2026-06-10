export interface Telemetry {
  speedOverGroundKn: number | null;
  courseOverGroundDeg: number | null;
  depthM: number | null;
  windSpeedApparentMs: number | null;
  windAngleApparentDeg: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  note: string;
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  { id: "signalk", name: "SignalK", note: "Open marine data standard" },
  { id: "nmea2000", name: "NMEA 2000", note: "via SignalK gateway" },
  { id: "nmea0183", name: "NMEA 0183", note: "via SignalK gateway" },
  { id: "garmin", name: "Garmin", note: "via SignalK plugin" },
  { id: "raymarine", name: "Raymarine", note: "via SignalK plugin" },
];

type StatusCallback = (status: "idle" | "connecting" | "open" | "closed" | "error") => void;

const EMPTY: Telemetry = {
  speedOverGroundKn: null,
  courseOverGroundDeg: null,
  depthM: null,
  windSpeedApparentMs: null,
  windAngleApparentDeg: null,
  latitude: null,
  longitude: null,
};

export class SignalKClient {
  private ws: WebSocket | null = null;
  private current: Telemetry = { ...EMPTY };

  connect(host: string, onData: (t: Telemetry) => void, onStatus: StatusCallback) {
    onStatus("connecting");
    this.current = { ...EMPTY };
    const url = `ws://${host}/signalk/v1/stream?subscribe=all`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => onStatus("open");
    this.ws.onclose = () => onStatus("closed");
    this.ws.onerror = () => onStatus("error");
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        for (const update of msg?.updates ?? []) {
          for (const value of update.values ?? []) {
            switch (value.path) {
              case "navigation.speedOverGround": this.current.speedOverGroundKn = value.value * 1.94384; break;
              case "navigation.courseOverGroundTrue": this.current.courseOverGroundDeg = (value.value * 180) / Math.PI; break;
              case "environment.depth.belowKeel": this.current.depthM = value.value; break;
              case "environment.wind.speedApparent": this.current.windSpeedApparentMs = value.value; break;
              case "environment.wind.angleApparent": this.current.windAngleApparentDeg = (value.value * 180) / Math.PI; break;
              case "navigation.position": this.current.latitude = value.value.latitude; this.current.longitude = value.value.longitude; break;
            }
          }
        }
        onData({ ...this.current });
      } catch { /* ignore */ }
    };
  }

  disconnect() { this.ws?.close(); this.ws = null; }
}
