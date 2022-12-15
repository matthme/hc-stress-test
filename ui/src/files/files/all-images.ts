import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { InstalledCell, AgentPubKey, EntryHash, ActionHash, Record, AppWebsocket, InstalledAppInfo } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { appWebsocketContext, appInfoContext } from '../../contexts';
import '@material/mwc-circular-progress';

import './file-detail';

@customElement('all-images')
export class AllImages extends LitElement {
  @consume({ context: appWebsocketContext })
  appWebsocket!: AppWebsocket;

  @consume({ context: appInfoContext })
  appInfo!: InstalledAppInfo;


  _fetchFiles = new Task(this, ([]) => this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: this.cellData.cell_id,
      zome_name: 'files',
      fn_name: 'get_all_images',
      payload: null,
      provenance: this.cellData.cell_id[1]
  }) as Promise<Array<ActionHash>>, () => []);

  get cellData() {
    return this.appInfo.cell_data.find((c: InstalledCell) => c.role_name === 'files')!;
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) return html`<span>No files found.</span>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(hash =>
          html`<file-detail .fileHash=${hash} style="margin-bottom: 16px;" @file-deleted=${() => this._fetchFiles.run()}></file-detail>`
        )}
      </div>
    `;
  }

  render() {
    console.log("RENDERING ALL IMAGES");
    return this._fetchFiles.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (hashes) => this.renderList(hashes),
      error: (e: any) => html`<span>Error fetching the images: ${e.data.data}.</span>`
    });
  }
}
