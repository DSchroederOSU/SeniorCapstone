# Senior Capstone Repository 2017-2018
**Members:**

Daniel Schroeder

Parker Bruni

Aubrey Thenell 
<br><br>

# Clone this repo
```git clone https://github.com/DSchroederOSU/SeniorCapstone.git```  
```cd SeniorCapstone```
<br><br>

# Make sure that remote origin is set to the correct url
```git remote -v```

#### Output:

``` origin	https://github.com/DSchroederOSU/SeniorCapstone.git (fetch)```  
``` origin	https://github.com/DSchroederOSU/SeniorCapstone.git (push)```
<br><br>


# Create a new branch under your name
```git checkout -b YOUR_NAME```
<br><br>


# To push to master
```git commit -am "YOUR MESSAGE ABOUT YOUR COMMIT"```

```git push origin YOUR_BRANCH_NAME```

This will make your branch a head of master. Then in your branch on Github.com you can click:

![Pull Request Screenshot](https://github.com/DSchroederOSU/SeniorCapstone/blob/master/Misc/Github_Pull_request.png)


# For pulling from master and merging into local branch
```git fetch```  
```git rebase origin/master```

# If there are merge conflicts your will receive dialogue
>CONFLICT (content): Merge conflict in...</br> error: Failed to merge in the changes.</br>When you have resolved this problem, run "git rebase --continue".
If you prefer to skip this patch, run "git rebase --skip" instead.
To check out the original branch and stop rebasing, run "git rebase --abort".

Once you resolve the conflicts, run:  
```git add [FILENAME]```  
Where FILENAME is the file that had conflicts. Then run:  
```git rebase --continue```