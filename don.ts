import { createRestAPIClient } from "npm:masto@6.3.1";

interface DonConfig {
  instanceURL: string;
  accessToken: string;
}

const version = "0.1.0";

const configLocation = Deno.env.get("HOME") + "/.don.json";

let config: DonConfig = {
  instanceURL: "",
  accessToken: "",
};

try {
  config = JSON.parse(Deno.readTextFileSync(configLocation)) as DonConfig;
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }

  console.log(`don configuration at ${configLocation} not detected.`);
  console.log(`beginning interactive don configuration`);

  const instanceURL = prompt(
    "Please enter your Mastodon instance URL (ex: https://mastodon.social):"
  );
  if (!instanceURL) throw new Error("Missing instanceURL");

  confirm(
    `You must create a new application for don with default permissions at ${instanceURL}/settings/application. Confirm when done.`
  );
  const accessToken = prompt("Please enter your access token for don:");

  if (!accessToken) throw new Error("Missing accessToken");

  config = {
    instanceURL: instanceURL,
    accessToken: accessToken,
  };

  Deno.writeTextFileSync(configLocation, JSON.stringify(config, null, 2));
}

function signout() {
  Deno.removeSync(configLocation);
  console.log("Signed out of don.");
}

async function post(content: string) {
  config;

  const masto = createRestAPIClient({
    url: config.instanceURL,
    accessToken: config.accessToken,
  });

  const status = await masto.v1.statuses.create({
    status: content,
    visibility: "public",
  });

  console.log("Post created:", status.url);
  return;
}

const command = Deno.args[0];

switch (command) {
  case "signout": {
    signout();
    break;
  }
  case "post":
  case "p": {
    await post(Deno.args[1]);
    break;
  }
  case "-v":
  case "--version":
  case "version": {
    console.log("don", version);
    break;
  }
  default: {
    if (command) {
      console.log(`Command ${command} not recongnized\n`);
    }
    console.log("don is a simple CLI for interacting with Mastodon.");
    console.log('Create a post with:\n\tdon post "Hello, world!"');
    console.log("Sign out with:\n\tdon signout");
    console.log("Get the version with:\n\tdon version");
  }
}

Deno.exit();
