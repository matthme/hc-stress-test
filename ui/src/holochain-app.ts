/* eslint-disable no-console */
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  AppAgentWebsocket,
} from '@holochain/client';
import { provide } from '@lit-labs/context';
import '@material/mwc-circular-progress';
import { decode } from '@msgpack/msgpack';

import { appAgentWebsocketContext } from './contexts';
import { AllImages } from './files/files/all-images';
import { getCellId } from './utils';


customElements.define("all-images", AllImages)

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;

  @provide({ context: appAgentWebsocketContext })
  @property({ type: Object })
  appAgentWebsocket!: AppAgentWebsocket;


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
      // create a fake devhub happ release hash from the filehash --> used to compare when joining an applet
      // to ensure it is the same applet and to allow recognizing same applets across groups
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

    // eslint-disable-next-line no-plusplus
    for (let i = 1; i < this.copies.valueAsNumber + 1; i++) {
      this.currentImgNr = i;
      const uid = Math.floor(Math.random()*100000);
      console.log("Storing file copy ", i,"...");
      // const cellInfo = this.appInfo.cell_info["files"].find((c) => "provisioned" in c)
      ;
      // eslint-disable-next-line no-await-in-loop
      const record = await this.appAgentWebsocket.callZome({
        zome_name: "files",
        fn_name: "create_file",
        payload: {
          data: this.fileBytes,
          uid,
        },
        // provenance: getCellId(cellInfo!)![1],
        role_name: "files",
      });

      console.log("File copy stored! Got record back: ", record);
      console.log("With entry: ", decode((record.entry as any).Present.entry) as File);
    }

    setTimeout(() => {
      this.totalImgNrs = undefined;
      this.currentImgNr = undefined;
      this.storing = false
    }, 3000);

  }

  async firstUpdated() {
    this.appAgentWebsocket = await AppAgentWebsocket.connect(new URL(`wss://unused`), "hc-stress-test");

    this.loading = false;
  }

  render() {
    if (this.loading)
      return html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `;

    return html`
      <main>
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
