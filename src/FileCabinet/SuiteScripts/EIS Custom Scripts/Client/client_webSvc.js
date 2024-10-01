function adminFormSave()
{
	//Notice to the user that they are accessing the Administrator or Web Service form
	
	if( !confirm('Warning: You are attempting to save a record using an Administrator form. \nCustom EIS functions and validations are not present.  Programmed workflows will not be implemented.  \nAre you sure you want to continue?') )
	{
		return false;
	}
	return true;
}
