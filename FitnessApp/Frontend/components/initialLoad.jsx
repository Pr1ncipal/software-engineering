import SQLite from "react-native-sqlite-storage";
import * as SecureStore from "expo-secure-store";
import { API_URL, db } from "./globals";

db.transaction((tx) => {
    tx.executeSql(
      "CREATE TABLE IF NOT EXISTS exercise_relation (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, revID INTEGER);"
    );
  });


const initialLoad = async () => {}