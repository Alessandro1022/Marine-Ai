export interface SignalKData {
  speed_knots: number | null;
  heading_deg: number | null;
  depth_m: number | null;
  wind_speed_ms: number | null;
  wind_angle_deg: number | null;
  latitude: number | null;
  longitude: number | null;
  connected: boolean;
}

export class SignalKClient {
  private ws: WebSocket | null = null;
  private onData: (data: Partial<SignalKData>) => void;

  constructor(onData: (data: Partial<SignalKData>) => void) {
    this.onData = onData;
  }

  connect(host: string, port = 3000) {
    const url = `ws://${host}:${port}/signalk/v1/stream?subscribe=all`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this.onData({ connected: true });
    this.ws.onclose = () => this.onData({ connected: false });
    this.ws.onerror = () => this.onData({ connected: false });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const updates = msg?.updates ?? [];
        const result: Partial<SignalKData> = {};

        for (const update of updates) {
          for (const value of update.values ?? []) {
            switch (value.path) {
              case "navigation.speedOverGround":
                result.speed_knots = value.value * 1.94384;
                break;
              case "navigation.headingTrue":
                result.heading_deg = (value.value * 180) / Math.PI;
                break;
              case "environment.depth.belowKeel":
                result.depth_m = value.value;
                break;
              case "environment.wind.speedApparent":
                result.wind_speed_ms = value.value;
                break;
              case "environment.wind.angleApparent":
                result.wind_angle_deg = (value.value * 180) / Math.PI;
                break;
              case "navigation.position":
                result.latitude = value.value.latitude;
                result.longitude = value.value.longitude;
                break;
            }
          }
        }

        if (Object.keys(result).length > 0) this.onData(result);
      } catch {
        // ignore malformed frames
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
