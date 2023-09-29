import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  AppWebsocket,
  ActionHash,
  AppInfo,
  AppAgentWebsocket,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import { decode } from '@msgpack/msgpack';
import '@material/mwc-circular-progress';
import { HappNotification, NotificationId, notify, resetNotificationCount } from '@holochain/launcher-api';

import { appAgentWebsocketContext, appInfoContext } from './contexts';
import { AllImages } from './files/files/all-images';
import { getCellId } from './utils';


customElements.define("all-images", AllImages)

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @provide({ context: appAgentWebsocketContext })
  @property({ type: Object })
  appAgentWebsocket!: AppAgentWebsocket;

  appWebsocket!: AppWebsocket;


  @provide({ context: appInfoContext })
  @property({ type: Object })
  appInfo!: AppInfo;

  @state()
  storing: boolean = false;

  @state()
  totalImgNrs: number | undefined = undefined;

  @state()
  currentImgNr: number | undefined = undefined;

  @state()
  fileBytes: Uint8Array | undefined;

  @query("#file-upload")
  fileUpload!: HTMLInputElement;

  @query("#n-copies")
  copies!: HTMLInputElement;

  @state()
  interval: any;

  @state()
  backgroundNotifications: boolean = false;

  @state()
  customCountReset: string | undefined;

  @state()
  unreadNotifications: Array<NotificationId> = [];

    // TODO! make typing right here
  async loadFileBytes(e: any) {
    const files: FileList = e.target.files;

    const reader = new FileReader();
    reader.onload = (err) => {
      console.log(err.target?.result);
    }
    reader.readAsArrayBuffer(files[0]);
    // TODO! make typing right here
    reader.onloadend = (_e) => {
      const buffer = reader.result as ArrayBuffer;
      const ui8 = new Uint8Array(buffer);
      this.fileBytes = ui8;
      console.log("File loaded into memory: ", ui8);
    }
  }

  async storeFile() {
    if (!this.fileBytes) {
      alert!("No file selected!");
      return;
    }

    if (!this.copies.valueAsNumber || this.copies.valueAsNumber < 1) {
      alert!("minimum number of copies is 1.")
      return;
    }

    this.storing = true;
    this.totalImgNrs = this.copies.valueAsNumber;
    this.currentImgNr = 0;

    const cellInfo = this.appInfo.cell_info.files.find((c) => "provisioned" in c);

    console.log("Total image numbers", this.totalImgNrs);
    console.log("Array: ", new Array(this.totalImgNrs).fill(0));

    try {
      await Promise.all(new Array(this.totalImgNrs).fill(0).map(async (_) => {
        console.log("Storing file.");
        const uid = Math.floor(Math.random()*100000);
        const record = await this.appAgentWebsocket.callZome({
          cell_id: getCellId(cellInfo!)!,
          zome_name: "files",
          fn_name: "create_file",
          payload: {
            data: this.fileBytes,
            uid,
          },
          provenance: getCellId(cellInfo!)![1],
        });

        console.log("File copy stored! Got record back: ", record);
        console.log("With entry: ", decode((record.entry as any).Present.entry) as File);
        if (this.currentImgNr) {
          this.currentImgNr += 1;
          this.requestUpdate();
        };
      }));
    } catch(e) {
      console.error("Failed to store all images: ", e);
      console.error("stringified error: ", JSON.stringify(e));
    }

    setTimeout(() => {
      this.totalImgNrs = undefined;
      this.currentImgNr = undefined;
      this.storing = false
    }, 3000);

  }

  async firstUpdated() {
    this.appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    this.appInfo = await this.appWebsocket.appInfo({
      installed_app_id: 'hc-stress-test',
    });

    this.appAgentWebsocket = await AppAgentWebsocket.connect("", "hc-stress-test");

    this.loading = false;

    this.unreadNotifications = this.readUnreadNotifications();

    if (window.localStorage.getItem("backgroundNotifications") === "true") {
      this.backgroundNotifications = true;
      this.startBackgroundNotifications();
    }

  }

  startBackgroundNotifications() {
    if (this.interval) clearInterval(this.interval);
    // Create notifications every 6 seconds to test whether app is running properly in the background
    this.interval = setInterval(() => {
      this.notifyMedium();
      setTimeout(() => this.notifyHigh(), 2000);
    }, 6000);
  }

  disconnectedCallback(): void {
    if (this.interval) clearInterval(this.interval);
  }

  async notifyHigh(customCountReset?: NotificationId) {
    const notification: HappNotification = {
      title: "Hello",
      body: "This is a message from hc-stress-test",
      notification_type: "random",
      icon_file_name: undefined,
      urgency: "high",
      timestamp: Date.now(),
      custom_count_reset: customCountReset,
    }
    console.log("Sending notification: ", notification);
    setTimeout(async () => notify([notification]), 5000);
  }

  async notifyHighOutdated() {
    const notification: HappNotification = {
      title: "Hello",
      body: "This is an OUTDATED message from hc-stress-test",
      notification_type: "random",
      icon_file_name: undefined,
      urgency: "high",
      timestamp: (Date.now() - 6*60*1000),
    }
    setTimeout(async () => notify([notification]), 5000);
  }

  async notifyMedium(customCountReset?: NotificationId) {
    const notification: HappNotification = {
      title: "Hello",
      body: "This is a message from hc-stress-test",
      notification_type: "random",
      icon_file_name: undefined,
      urgency: "medium",
      timestamp: Date.now(),
      custom_count_reset: customCountReset,
    }
    setTimeout(async () => notify([notification]), 5000);
  }

  readUnreadNotifications(): Array<NotificationId> {
    let unreadNotifications: Array<NotificationId> = [];
    const unreadNotificationsJSON: string | null = window.localStorage.getItem("unreadNotifications");
    if (unreadNotificationsJSON) {
      unreadNotifications = JSON.parse(unreadNotificationsJSON);
    }
    return unreadNotifications;
  }

  async emitNotificationWithId(customCountReset: NotificationId) {

    let unreadNotifications = this.readUnreadNotifications();
    unreadNotifications = [...new Set([...unreadNotifications, customCountReset])];
    window.localStorage.setItem("unreadNotifications", JSON.stringify(unreadNotifications));
    this.unreadNotifications = unreadNotifications;
    await this.notifyHigh(customCountReset);
  }

  async clearNotificationWithId(customCountReset: NotificationId) {
    await resetNotificationCount([customCountReset]);
    const unreadNotifications = this.readUnreadNotifications();
    const clearedUnreadNotifications = unreadNotifications.filter((notificationId) => notificationId !== customCountReset);
    window.localStorage.setItem("unreadNotifications", JSON.stringify(clearedUnreadNotifications));
    this.unreadNotifications = clearedUnreadNotifications;
  }

  toggleBackgroundNotifications() {
    if (this.backgroundNotifications) {
      this.backgroundNotifications = false;
      clearInterval(this.interval);
      window.localStorage.setItem("backgroundNotifications", "false");
    } else {
      this.backgroundNotifications = true;
      this.startBackgroundNotifications();
      window.localStorage.setItem("backgroundNotifications", "true");
    }
  }

  render() {
    if (this.loading)
      return html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `;
    return html`
      <main>
        <button @click=${async () => this.notifyHigh()} style="margin-top: 50px;">Notify Launcher in 5s with High Urgency</button>
        <button @click=${async () => this.notifyMedium()} style="margin-top: 10px;">Notify Launcher in 5s with Medium Urgency</button>
        <button @click=${async () => this.notifyHighOutdated()} style="margin-top: 10px;">Notify Launcher in 5s with OUTDATED message of high Urgency</button>

        <div style="margin-top: 30px;" class="row">
          <button @click=${() => this.toggleBackgroundNotifications()}>Turn ${this.backgroundNotifications ? "OFF" : "ON" } background notifications</button>
        </div>

        <div class="column" style="align-items: center;">
          <h3>Send Notification with custom ID</h3>
          <div>Sends a notification to the Launcher with a custom ID, i.e. it will only be reset in the Launcher
            UI if explicitly requested.
          </div>
          <div class="row">
            <input id="custom-count-reset-input" @input=${() => {
              this.customCountReset = (this.shadowRoot!.getElementById("custom-count-reset-input") as HTMLInputElement).value;
              console.log("this.customCountReset: ", this.customCountReset);
            }} type="text">
            <button @click=${async () => this.customCountReset ? this.emitNotificationWithId(this.customCountReset) : alert("No notification id set.")} style="margin-top: 10px;">Send</button>
          </div>

          <div class="column" style="margin-top: 15px; align-items: flex-end;">
            ${this.unreadNotifications.map((id) => html`
              <div class="row" style="margin-bottom: 3px;">
                <span>${id}</span>
                <button @click=${() => this.clearNotificationWithId(id)}>Clear</button>
              </div>

            `)}
          </div>
        </div>


        <h1>Upload image:</h1>

        <div id="content" style="display: flex; flex-direction: column;">
          <div style="display: flex; flex-direction: row;">
            <input
              style="margin-top: 7px;"
              type="file"
              id="file-upload"
              accept="image/png"
              @change=${this.loadFileBytes}
            >
            number of copies: <input type="number" min="1" id="n-copies">

            <button @click=${this.storeFile}>Store!</button>
          </div>

          ${this.storing ? html`<div>uploading image ${this.currentImgNr} / ${this.totalImgNrs}</div>` : ``}

          <div>
            <all-images></all-images>
          </div>

        </div>
      </main>
    `;
  }

  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--lit-element-background-color);
    }

    main {
      flex-grow: 1;
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;
}
