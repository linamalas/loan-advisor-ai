from pydantic import BaseModel




class LoanFeatures(BaseModel):
    LOAN:float
    MORTDUE:float
    VALUE:float
    YOJ:float
    DEROG:float
    DELINQ:float
    CLAGE:float
    NINQ:float
    CLNO:float
    DEBTINC:float
    REASON_HomeImp:bool
    REASON_Unknown:bool
    JOB_Office:bool
    JOB_Other:bool
    JOB_ProfExe:bool
    JOB_Sales:bool
    JOB_Self:bool
    JOB_Mgr:bool