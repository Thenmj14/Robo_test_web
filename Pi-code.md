**Phase 1: Preparing the "Warehouse"**

First, we must create the folder structure where the different versions of our software will live.



Open your Terminal and run these commands:



\[

\# Create the folder for Version 1.0.0

**sudo mkdir -p /opt/robot/versions/v1.0.0**



\# Give yourself permission to edit these folders without 'sudo' every time

**sudo chown -R $USER:$USER /opt/robot]**



**Phase 2: Creating the First "Brain" (v1.0.0)**



Step 2: The Base Brain (Initial Version 1.0.0)

HIGHLIGHT THIS: This is where the "Old Version" lives. Every system needs a stable starting point.



Navigate to the folder:

**cd /opt/robot/versions/v1.0.0**



Create the Code:

**nano main.py**



The Version 1.0.0 Code:



Python:



**import time**

**VERSION = "1.0.0"**

**while True:**

&#x20;   **print(f"I am Version {VERSION}. Everything is okay.")**

&#x20;   **time.sleep(5)**



(Press Ctrl+O, Enter, Ctrl+X to save).



**Phase 3: The "Magic Switch" (Symlink)**

Instead of running the code directly from the version folder, we create a "Shortcut" (Symbolic Link). This is the secret to the whole project.



Create the link:

**ln -s /opt/robot/versions/v1.0.0 /opt/robot/current**



Why we do this: We tell the robot to always look at /opt/robot/current/main.py. Later, we can point "current" to a new folder without stopping the robot.



**Phase 4: Creating the "Mechanic" (OTA Manager)**

This script is the "Doctor" that performs the brain surgery (updates) automatically.



Open Nano:

**nano /opt/robot/ota\_manager.py**



Paste this complete, fixed code:



Python:



**\[import requests**

**import os**

**import zipfile**

**import shutil**

**import subprocess**

**import time**



**# --- CONFIGURATION ---**

**API\_URL = "http://192.168.1.12:3000/api/robot" # Matches your current laptop IP**

**BASE\_DIR = "/opt/robot/versions"**

**CURRENT\_LINK = "/opt/robot/current"**

**TEMP\_EXTRACT = "/opt/robot/temp\_extract"**

**MASTER\_KEY\_PATH = "/opt/robot/master\_key.txt"**



**def fetch\_update\_info():**

&#x20;   **try:**

&#x20;       **print(f"Connecting to dashboard at {API\_URL}...")**

&#x20;       **response = requests.get(API\_URL, timeout=5)**

&#x20;       **data = response.json()**

&#x20;       **if str(data.get('trigger\_update')).lower() == "true":**

&#x20;           **return data.get('github\_url')**

&#x20;       **return None**

&#x20;   **except Exception as e:**

&#x20;       **print(f"Error connecting to Web Server: {e}")**

&#x20;       **return None**



**def verify\_zip\_signature(zip\_file\_path):**

&#x20;   **"""PEEK GATEKEEPER: Scans the ZIP contents for secret\_key.txt and validates it"""**

&#x20;   **print("🔒 Gatekeeper: Checking update signature...")**

&#x20;   **try:**

&#x20;       **# Read the master key stored on the Pi**

&#x20;       **with open(MASTER\_KEY\_PATH, 'r') as f:**

&#x20;           **master\_key = f.read().strip()**



&#x20;       **with zipfile.ZipFile(zip\_file\_path, 'r') as zip\_ref:**

&#x20;           **# Get a list of EVERY file path inside the ZIP**

&#x20;           **all\_files = zip\_ref.namelist()**

&#x20;           

&#x20;           **# Find the file that ends with secret\_key.txt, no matter what folder it sits in**

&#x20;           **key\_file\_in\_zip = None**

&#x20;           **for file\_path in all\_files:**

&#x20;               **if file\_path.endswith("secret\_key.txt"):**

&#x20;                   **key\_file\_in\_zip = file\_path**

&#x20;                   **break**

&#x20;           

&#x20;           **if not key\_file\_in\_zip:**

&#x20;               **print("❌ GATEKEEPER CRITICAL FAILURE: secret\_key.txt missing from ZIP payload.")**

&#x20;               **return False**

&#x20;           

&#x20;           **# Read the secret key directly out of that path location**

&#x20;           **with zip\_ref.open(key\_file\_in\_zip) as zf:**

&#x20;               **incoming\_key = zf.read().decode('utf-8').strip()**



&#x20;       **# Compare the keys**

&#x20;       **if incoming\_key == master\_key:**

&#x20;           **print("✅ GATEKEEPER SUCCESS: Signatures match! Proceeding with extraction...")**

&#x20;           **return True**

&#x20;       **else:**

&#x20;           **print("❌ GATEKEEPER CRITICAL FAILURE: Keys do not match! Fake update detected.")**

&#x20;           **return False**

&#x20;           

&#x20;   **except Exception as e:**

&#x20;       **print(f"❌ Gatekeeper Verification Error: {e}")**

&#x20;       **return False**

**def do\_update(zip\_url):**

&#x20;   **old\_version\_path = os.path.realpath(CURRENT\_LINK) if os.path.exists(CURRENT\_LINK) else None**



&#x20;   **print(f"Downloading update from GitHub...")**

&#x20;   **r = requests.get(zip\_url)**

&#x20;   **with open("update.zip", "wb") as f:**

&#x20;       **f.write(r.content)**



&#x20;   **# 🔥 SECURITY GATEKEEPER CHECK RUNS HERE 🔥**

&#x20;   **if not verify\_zip\_signature("update.zip"):**

&#x20;       **print("🚨 SECURITY ALERT: Deleting malicious package immediately.")**

&#x20;       **if os.path.exists("update.zip"): os.remove("update.zip")**

&#x20;       **return # STOP THE UPDATE IMMEDIATELY!**



&#x20;   **# Proceeding only if signature check passed**

&#x20;   **if os.path.exists(TEMP\_EXTRACT): shutil.rmtree(TEMP\_EXTRACT)**

&#x20;   **with zipfile.ZipFile("update.zip", "r") as zip\_ref:**

&#x20;       **zip\_ref.extractall(TEMP\_EXTRACT)**



&#x20;   **# Determine Version Tag Name Dynamically**

&#x20;   **extracted\_folders = os.listdir(TEMP\_EXTRACT)**

&#x20;   **inner\_folder = os.path.join(TEMP\_EXTRACT, extracted\_folders\[0])**

&#x20;   

&#x20;   **new\_version\_tag = "v\_unknown"**

&#x20;   **try:**

&#x20;       **new\_main\_path = os.path.join(inner\_folder, "main.py")**

&#x20;       **with open(new\_main\_path, 'r') as f:**

&#x20;           **for line in f:**

&#x20;               **if 'VERSION =' in line:**

&#x20;                   **new\_version\_tag = "v" + line.split('"')\[1]**

&#x20;                   **break**

&#x20;   **except:**

&#x20;       **new\_version\_tag = "v\_manual\_update\_" + str(int(time.time()))**



&#x20;   **target\_dir = os.path.join(BASE\_DIR, new\_version\_tag)**



&#x20;   **if os.path.exists(target\_dir): shutil.rmtree(target\_dir)**

&#x20;   **shutil.move(inner\_folder, target\_dir)**

&#x20;   **print(f"New code moved to: {target\_dir}")**



&#x20;   **print("Switching symlink to new version...")**

&#x20;   **if os.path.lexists(CURRENT\_LINK): os.unlink(CURRENT\_LINK)**

&#x20;   **os.symlink(target\_dir, CURRENT\_LINK)**



&#x20;   **# Health Check**

&#x20;   **print("Verifying stability...")**

&#x20;   **try:**

&#x20;       **process = subprocess.Popen(\["python3", os.path.join(CURRENT\_LINK, "main.py")])**

&#x20;       **time.sleep(5)**

&#x20;       **if process.poll() is not None:**

&#x20;           **raise Exception("New version crashed on startup!")**

&#x20;       **process.terminate()**

&#x20;       **print("--- UPDATE SUCCESSFUL ---")**

&#x20;   **except Exception as e:**

&#x20;       **print(f"!!! UPDATE FAILED: {e} !!!")**

&#x20;       **if old\_version\_path:**

&#x20;           **print(f"Rolling back to: {old\_version\_path}")**

&#x20;           **if os.path.lexists(CURRENT\_LINK): os.unlink(CURRENT\_LINK)**

&#x20;           **os.symlink(old\_version\_path, CURRENT\_LINK)**

&#x20;           **os.system("sudo systemctl restart robot\_app.service")**



&#x20;   **if os.path.exists("update.zip"): os.remove("update.zip")**

&#x20;   **if os.path.exists(TEMP\_EXTRACT): shutil.rmtree(TEMP\_EXTRACT)**



**if \_\_name\_\_ == "\_\_main\_\_":**

&#x20;   **github\_link = fetch\_update\_info()**

&#x20;   **if github\_link:**

&#x20;       **do\_update(github\_link)**

&#x20;   **else:**

&#x20;       **print("No update needed.")]**

Save and Exit: Ctrl+O, Enter, Ctrl+X.



**Phase 5: Releasing the New Brain (GitHub)**

On your Laptop, go to GitHub and create a repository called robot-test.



Add a file named main.py with this code (Version 2.0.0):



Python:



**\[import time**

**VERSION = "2.0.0"**

**while True:**

&#x20;   **print(f"I AM THE NEW VERSION {VERSION}! THE UPDATE WORKED!")**

**time.sleep(5)]**



Click the green Code button -> Download ZIP. Right-click that button and Copy Link Address.



Important: Paste that link into your ota\_manager.py on the Pi (the URL = line).



**Phase 6: Running the System**

Here are the final commands to show the project in action:



Show the robot running Version 1.0.0:

**python3 /opt/robot/current/main.py**

(Press Ctrl+C to stop).



Run the Update (The Mechanic):

**python3 /opt/robot/ota\_manager.py**



Show the robot running Version 2.0.0 (The Proof):

**python3 /opt/robot/current/main.py**



The "Emergency Rollback" (Switch back to 1.0.0 instantly):

**ln -sfn /opt/robot/versions/v1.0.0 /opt/robot/current**







**----Even system got restart it should be in latest updated version not the old one----**



**Step 1: Create the Updater Service**

This service runs once at boot to check if there is a new link or an "Install" trigger on your dashboard.



Open the file:

**sudo nano /etc/systemd/system/robot\_updater.service**



Paste this exactly:



**\[**

**\[Unit]**

**Description=Robot OTA Updater Service**

**After=network-online.target**

**Wants=network-online.target**



**\[Service]**

**Type=oneshot**

**WorkingDirectory=/opt/robot**

**ExecStart=/usr/bin/python3 /opt/robot/ota\_manager.py**

**User=lenasekar**



**\[Install]**

**WantedBy=multi-user.target]**

Save and Exit: Ctrl+O, Enter, Ctrl+X.



**Step 2: Create the Application Service**

This service runs your real robot code right after the update check is done.



Open the file:

**sudo nano /etc/systemd/system/robot\_app.service**



Paste this exactly:



**\[**

**\[Unit]**

**Description=Robot Main Application**

**After=robot\_updater.service**



**\[Service]**

**WorkingDirectory=/opt/robot**

**ExecStart=/usr/bin/python3 /opt/robot/current/main.py**

**Restart=always**

**RestartSec=5**

**User=lenasekar**



**\[Install]**

**WantedBy=multi-user.target**

**Save and Exit: Ctrl+O, Enter, Ctrl+X. ]**



**Step 3: Enable and Test**

Now you have to tell the Raspberry Pi's "brain" to actually use these new instructions.



Reload the system:

**sudo systemctl daemon-reload**



Enable them for boot:





**sudo systemctl enable robot\_updater.service**

**sudo systemctl enable robot\_app.service**



The Final Test:

Type sudo reboot and wait for the Pi to restart.



How to verify it worked (The "Magic" Moment)

Once the Pi restarts, don't type anything. Just wait 30 seconds for the Wi-Fi to connect. Then, type this to see if your code is already running in the background:

sudo systemctl status robot\_app.service



If you see "Active: active (running)", you've done it! Your robot is now "Production Ready." Even if you shut it down and move it to a different room, it will stay on Version 2 (or Version 3, 4, etc.) because the Symlink on the SD card points to the latest folder you downloaded.







**---- After update the code on web ----**

Deploy from Web: Push your "Install" command from your laptop dashboard.



Update on Pi: Run the update manually to show the progress:

**sudo python3 /opt/robot/ota\_manager.py**



Restart the Service: This "activates" the new code in the background:

**sudo systemctl restart robot\_app.service**



Show the Output: Run the log command to show everyone it's working:

**journalctl -u robot\_app.service -f**



**----ROLL BACK TO VERSION 1----**

Step 1: Point the Switch to Version 1

Run these two commands to change the destination of your current link:



\# 1. Remove the existing link to the update

**sudo rm /opt/robot/current**



\# 2. Create a new link pointing to Version 1 (note the 's' in versions!)

**sudo ln -s /opt/robot/versions/v1.8.8 /opt/robot/current**



Step 2: Restart the App to Load Version 1

Since the robot code is running in the background, it won't know you flipped the switch until you restart it. Run this:

**sudo systemctl restart robot\_app.service**



Step 3: Verify it worked

Now, "peek" into the background logs to see if it is printing the Version 1 message:

**journalctl -u robot\_app.service -f**

You should see "I AM VERSION 1" appearing every 5 seconds.



Step 4: Check the "Link" (Optional)

If you want to be 100% sure the path is correct, run:

**ls -1 /opt/robot/current**

It should show: current -> /opt/robot/versions/v1.0.0

&#x20;----------------------------

**1. List the Version Folders**

Open your terminal and run this command:



**ls -l /opt/robot/versions/**



**2. Look Inside the Folders**

If you want to see the actual code files (like main.py) inside each version, run these:



To see Version 1 files:



**cat /opt/robot/versions/v1.0.0/main.py**

To see Version 2 files:



**cat /opt/robot/versions/v2.0.0/main.py**

