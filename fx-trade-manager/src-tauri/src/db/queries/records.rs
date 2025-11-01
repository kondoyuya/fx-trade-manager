use rusqlite::{params, Connection, Result};
use std::error::Error;
use std::fs::File;
use csv::ReaderBuilder;

mod models;
use models::Record;