use hdi::prelude::*;
#[hdk_entry_helper]
#[derive(Clone)]
pub struct File {
    pub data: SerializedBytes,
}
