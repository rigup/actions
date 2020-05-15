const { Octokit } = require("@octokit/rest");
const {env} = require ("process");
const token = env.INPUT_GITHUB_TOKEN
const repository = env.GITHUB_REPOSITORY
const [owner, repo] = repository.split("/")

const octokit = new Octokit({
  auth: token
});

octokit.repos.listReleases({
  owner,
  repo,
}).then(res => {
  if(!res.data){
    console.error("💡 No releases found, skip delete.");
    return
  }

  console.log(JSON.stringify(res.data));
}).catch(
    err =>{
      if(err.status === 404){
        console.error("💡 No releases found, skip delete.");
        return
      }
      console.error("❌ Can't get latest Release");
      console.error(err);
    }
);
