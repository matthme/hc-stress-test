import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { InstalledCell, AppWebsocket, EntryHash, Record, ActionHash, InstalledAppInfo } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { decode } from '@msgpack/msgpack';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { serializeHash } from "@holochain-open-dev/utils";
import { classMap } from "lit/directives/class-map.js";


import './edit-file';

import { appInfoContext, appWebsocketContext } from '../../contexts';
import { File } from './types';

@customElement('file-detail')
export class FileDetail extends LitElement {
  @consume({ context: appWebsocketContext })
  appWebsocket!: AppWebsocket;

  @consume({ context: appInfoContext })
  appInfo!: InstalledAppInfo;

  @property({
    hasChanged: (newVal: ActionHash, oldVal: ActionHash) => newVal?.toString() !== oldVal?.toString()
  })
  fileHash!: ActionHash;

  @state()
  displayImg: boolean = false;

  @query("#image")
  image!: HTMLImageElement;

  _fetchRecord = new Task(this, ([fileHash]) => this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: this.cellData.cell_id,
      zome_name: 'files',
      fn_name: 'get_file',
      payload: fileHash,
      provenance: this.cellData.cell_id[1]
  }) as Promise<Record | undefined>, () => [this.fileHash]);

  @state()
  _editing = false;

  get cellData() {
    return this.appInfo.cell_data.find((c: InstalledCell) => c.role_name === 'files')!;
  }

  // async deleteFile() {
  //   try {
  //     await this.appWebsocket.callZome({
  //       cap_secret: null,
  //       cell_id: this.cellData.cell_id,
  //       zome_name: 'files',
  //       fn_name: 'delete_file',
  //       payload: this.fileHash,
  //       provenance: this.cellData.cell_id[1]
  //     });
  //     this.dispatchEvent(new CustomEvent('file-deleted', {
  //       bubbles: true,
  //       composed: true,
  //       detail: {
  //         fileHash: this.fileHash
  //       }
  //     }));
  //     this._fetchRecord.run();
  //   } catch (e: any) {
  //     const errorSnackbar = this.shadowRoot?.getElementById('delete-error') as Snackbar;
  //     errorSnackbar.labelText = `Error deleting the file: ${e.data.data}`;
  //     errorSnackbar.show();
  //   }
  // }

  renderDetail(record: Record) {
    console.log("RENDERING IMAGE DETAIL");
    const file = decode((record.entry as any).Present.entry) as File;
    // const decoder = new TextDecoder('utf8');
    // const base64String = btoa(decoder.decode(file.data));
    // const imgSrc = `base64:${base64String}`;
    // this.image.src = URL.createObjectURL(
    //   new Blob([file.data.buffer], { type: 'image/png' } /* (1) */)
    // );

    return html`
      <div style="display: flex; flex-direction: column">
      	<div style="display: flex; flex-direction: row">
          <div style="font-size: 18px; flex: 1;" class="hash-hover">${this.fileHash ? serializeHash(this.fileHash) : "file hash (yet) undefined"}</div>
          <div style="font-size: 18px; flex: 1;" class="hash-hover">UID: ${file.uid}</div>


        </div>

      </div>
    `;

// <!-- <img
// id="image"
// class="${classMap({
//       hidden: !this.displayImg,
//     })} hover-img"
// style="font-size: 18px; flex: 1;" class="hash-hover">${this.fileHash ? serializeHash(this.fileHash) : "file hash (yet) undefined"}</span> -->


// <!-- <mwc-icon-button style="margin-left: 8px" icon="edit" @click=${() => { this._editing = true; } }></mwc-icon-button>
// <mwc-icon-button style="margin-left: 8px" icon="delete" @click=${() => this.deleteFile()}></mwc-icon-button> -->
  }

  renderFile(maybeRecord: Record | undefined) {
    if (!maybeRecord) return html`<span>The requested file was not found.</span>`;

    // if (this._editing) {
    // 	return html`<edit-file
    // 	  .originalFileHash=${this.fileHash}
    // 	  .currentRecord=${maybeRecord}
    // 	  @file-updated=${async () => {
    // 	    this._editing = false;
    // 	    await this._fetchRecord.run();
    // 	  } }
    // 	  @edit-canceled=${() => { this._editing = false; } }
    // 	  style="display: flex; flex: 1;"
    // 	></edit-file>`;
    // }

    return this.renderDetail(maybeRecord);
  }

  render() {
    return this._fetchRecord.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (maybeRecord) => this.renderFile(maybeRecord),
      error: (e: any) => html`<span>Error fetching the image: ${e.data.data}</span>`
    });
  }


  static styles =
    css`
      :host {
        display: flex;
        position: relative;
      }

      .title {
        font-size: 1.4em;
        margin-top: 50px;
      }

      .hover-img {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1;
      }

      .hidden {
        display: none;
      }
    `

}
