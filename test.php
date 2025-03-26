<?php
// This triggers a user-level notice
trigger_error("This is a test PHP error", E_USER_NOTICE);

// This triggers a warning (undefined function)
undefined_function_call();

