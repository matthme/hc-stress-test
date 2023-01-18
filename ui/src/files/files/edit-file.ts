// import { LitElement, html } from 'lit';
// import { state, customElement, property } from 'lit/decorators.js';
// import { InstalledCell, ActionHash, EntryHash, AgentPubKey, Record, AppWebsocket, AppInfo } from '@holochain/client';
// import { consume } from '@lit-labs/context';
// import { decode } from '@msgpack/msgpack';
// import '@material/mwc-button';
// import '@material/mwc-snackbar';
// import { Snackbar } from '@material/mwc-snackbar';
// import '@material/mwc-slider';

// import { appWebsocketContext, appInfoContext } from '../../contexts';
// import { File } from './types';

// @customElement('edit-file')
// export class EditFile extends LitElement {

//   @consume({ context: appWebsocketContext })
//   appWebsocket!: AppWebsocket;

//   @consume({ context: appInfoContext })
//   appInfo!: AppInfo;

//   @property({
//       hasChanged: (newVal: ActionHash, oldVal: ActionHash) => newVal?.toString() !== oldVal?.toString()
//   })
//   originalFileHash!: ActionHash;


//   @property()
//   currentRecord!: Record;

//   get currentFile() {
//     return decode((this.currentRecord.entry as any).Present.entry) as File;
//   }

//   @state()
//   _data!: number;


//   isFileValid() {
//     return true && this._data !== undefined;
//   }

//   connectedCallback() {
//     super.connectedCallback();
//     this._data = this.currentFile.data;
//   }

//   async updateFile() {
//     const cellData = this.appInfo.cell_data.find((c: InstalledCell) => c.role_name === 'files')!;

//     const file: File = {
//       data: this._data!,
//     };

//     try {
//       const updateRecord: Record = await this.appWebsocket.callZome({
//         cap_secret: null,
//         cell_id: cellData.cell_id,
//         zome_name: 'files',
//         fn_name: 'update_file',
//         payload: {
//           original_file_hash: this.originalFileHash,
//           previous_file_hash: this.currentRecord.signed_action.hashed.hash,
//           updated_file: file
//         },
//         provenance: cellData.cell_id[1]
//       });

//       this.dispatchEvent(new CustomEvent('file-updated', {
//         composed: true,
//         bubbles: true,
//         detail: {
//           originalFileHash: this.originalFileHash,
//           previousFileHash: this.currentRecord.signed_action.hashed.hash,
//           updatedFileHash: updateRecord.signed_action.hashed.hash
//         }
//       }));
//     } catch (e: any) {
//       const errorSnackbar = this.shadowRoot?.getElementById('update-error') as Snackbar;
//       errorSnackbar.labelText = `Error updating the file: ${e.data.data}`;
//       errorSnackbar.show();
//     }
//   }

//   render() {
//     return html`
//       <mwc-snackbar id="update-error" leading>
//       </mwc-snackbar>

//       <div style="display: flex; flex-direction: column">
//         <span style="font-size: 18px">Edit File</span>
//           <div style="margin-bottom: 16px">
//           <div style="display: flex; flex-direction: row">
//             <span style="margin-right: 4px">Data</span>

//             <mwc-slider .value=${ (this._data } @input=${(e: CustomEvent) => { this._data = e.detail.value; } } discrete></mwc-slider>
//           </div>
//           </div>



//         <div style="display: flex; flex-direction: row">
//           <mwc-button
//             outlined
//             label="Cancel"
//             @click=${() => this.dispatchEvent(new CustomEvent('edit-canceled', {
//               bubbles: true,
//               composed: true
//             }))}
//             style="flex: 1; margin-right: 16px"
//           ></mwc-button>
//           <mwc-button
//             raised
//             label="Save"
//             .disabled=${!this.isFileValid()}
//             @click=${() => this.updateFile()}
//             style="flex: 1;"
//           ></mwc-button>
//         </div>
//       </div>`;
//   }
// }
