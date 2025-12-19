# Wie man zusammen arbeitet (Collaboration Guide)

Ja, genau so funktioniert es! Ihr nutzt beide **Git** und **GitHub**, um den Code auszutauschen.

## 1. Einrichtung für deinen Kumpel (Einmalig)
Dein Kumpel muss sich den Code erst einmal auf seinen PC holen ("Clonen").

1.  Er braucht **Git** und **Node.js** auf seinem PC.
2.  Er öffnet ein Terminal (oder Git Bash) und gibt ein:
    ```bash
    git clone https://github.com/janniskling/Moin-G-ttingen.git
    cd Moin-G-ttingen
    npm install
    npm run dev
    ```
    Jetzt hat er den gleichen Stand wie du und kann die App lokal starten!

## 2. Der Arbeitsablauf (Workflow)

### Wenn du (Jannis) etwas änderst:
Du programmierst hier, speicherst ab und dann:
```bash
# 1. Änderungen "sammeln"
git add .

# 2. Änderungen "verpacken" (Commit)
git commit -m "Beschreibe was du gemacht hast"

# 3. Hochladen (Push)
git push origin main
```

### Wenn dein Kumpel sich deine Änderungen holen will:
Bevor er loslegt, sollte er immer erst schauen, ob es etwas Neues gibt:
```bash
git pull origin main
```

### Wenn dein Kumpel etwas geändert hat:
Er macht genau das Gleiche wie du:
1.  `git add .`
2.  `git commit -m "Habe das Design angepasst"`
3.  `git push origin main`

### Wenn du dir seine Änderungen holen willst:
```bash
git pull origin main
```

## Troubleshooting
- **Passwort/Auth Fehler:** Wenn beim `git push` nach einem Passwort gefragt wird, muss man meistens ein "Personal Access Token" bei GitHub erstellen oder SSH nutzen.
- **Konflikte:** Wenn ihr beide gleichzeitig an der EXAKT gleichen Zeile gearbeitet habt, meckert Git beim `pull`. Dann müsst ihr euch kurz absprechen und die Datei bereinigen.
