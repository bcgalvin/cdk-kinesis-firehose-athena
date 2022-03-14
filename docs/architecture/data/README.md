## Seed Data: Single Table Modeling

![](erd.png)

| Entity | PK                 | SK                   |
|--------|--------------------|----------------------|
| State  | STATE#\<StateName> | STATE#\<StateName>   |
| County | STATE#\<StateName> | COUNTY#\<CountyName> |

| Access Pattern        | Index      | Parameters            | Notes | 
|-----------------------|------------|-----------------------|-------|
| Get Counties By State | Main Table | StateName             |       |
| Get County            | Main Table | StateName, CountyName |
