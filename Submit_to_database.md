After we fork a repository, I want to send information about the repository and project to a dashboard app at [https://www.tipl.fun](https://www.tipl.fun)

We can add our project by posting a JSON payload that contains a list of data fields. Here is the curl version of the post:

curl \-X POST https://www.tipl.fun/api/projects \`  
  \-H "Content-Type: application/json" \`  
  \-d '{  
    "token\_address": "token address",  
    "token\_symbol": "token symbol",  
    "token\_name": "token name",  
    "repo\_url": "github repo URL",  
    "treasury\_address": "project treasury address",  
    “uniswap\_pool\_address”: “uniswap\_pool”,  
    "notes": "text in markdown format",  
    "telegram": "telegram link",  
    “twitter\_account”: “twitter name”,  
    “maintainer\_email”: “maintainer email address”  
  }'

The required fields are:

* token\_address  
* token\_symbol  
* token\_name  
* treasury\_address  
* repo\_url

Here is an example of a post with data:

curl \-X POST https://www.tipl.fun/api/projects \`  
  \-H "Content-Type: application/json" \`  
  \-d '{  
    "token\_address": "0x177611f7B05983316ba2F44E62d702C9A8C7bbE8",  
    "token\_symbol": "TIPL3",  
    "token\_name": "TIPL Core IP and Treasury Two",  
    "repo\_url": "https://github.com/MaxosLLC/TIPL",  
    "treasury\_address": "0xF698340aa648DCF6bAbDeb93B0878A08755Bcd69",  
    "uniswap\_pool\_address": "0xa37852c7263ecf9205de7282d6fba4e1ac3d10f322f2a0d614e5cf2058a28082",  
    "notes": "Hello \*\*world\*\*",  
    "telegram": "[https://t.me/+dKec8qTSAlUzZDdh](https://t.me/+dKec8qTSAlUzZDdh)",  
    “twitter\_account”: “andysingleton”  
  }'

We will need to gather some new information from the user. All of the new information is optional. The new information includes:

* notes. This can be up to five lines of markdown text that describe the project. We can suggest a draft of these notes after reading the repo readme  
* telegram. This is a URL that is an invitation link for a telegram group  
* twitter\_account. This is a twitter account name. We can link to the twitter account with [https://x.com/](https://x.com/)\<twitter\_account\> . If the user pastes a URL, we will extract the twitter account name.  
* maintainer\_email. This is an email address

NPOST https://v0-tipl-dashboard-d7ld703vh-sweepr.vercel.app/api/projects `-H "Content-Type: application/json"`  
\-d '{  
"token\_address": "0x177611f7B05983316ba2F44E62d702C9A8C7bbE8",  
"token\_symbol": "TIPL3",  
"token\_name": "TIPL Core IP and Treasury Two",  
"repo\_url": "https://github.com/MaxosLLC/TIPL",  
"treasury\_address": "0xF698340aa648DCF6bAbDeb93B0878A08755Bcd69",  
"notes": "Hello world",  
"telegram": "https://t.me/+dKec8qTSAlUzZDdh"  
}