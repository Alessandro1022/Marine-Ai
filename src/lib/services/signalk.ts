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

export class SignalKClient {
  private ws: WebSocket | null = null;

  connect(host: string, onData: (t: Partial<Telemetry>) => void, onStatus: StatusCallback) {
    onStatus("connecting");
    const url = `ws://${host}/signalk/v1/stream?subscribe=all`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => onStatus("open");
    this.ws.onclose = () => onStatus("closed");
    this.ws.onerror = () => onStatus("error");
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const result: Partial<Telemetry> = {};
        for (const update of msg?.updates ?? []) {
          for (const value of update.values ?? []) {
            switch (value.path) {
              case "navigation.speedOverGround": result.speedOverGroundKn = value.value * 1.94384; break;
              case "navigation.courseOverGroundTrue": result.courseOverGroundDeg = (value.value * 180) / Math.PI; break;
              case "environment.depth.belowKeel": result.depthM = value.value; break;
              case "environment.wind.speedApparent": result.windSpeedApparentMs = value.value; break;
              case "environment.wind.angleApparent": result.windAngleApparentDeg = (value.value * 180) / Math.PI; break;
              case "navigation.position": result.latitude = value.value.latitude; result.longitude = value.value.longitude; break;
            }
          }
        }
        if (Object.keys(result).length > 0) onData(result);
      } catch { /* ignore */ }
    };
  }

  disconnect() { this.ws?.close(); this.ws = null; }
}
