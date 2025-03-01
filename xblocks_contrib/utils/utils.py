def display_name_with_default(block):
    """
    Calculates the display name for a block.

    Default to the display_name if it isn't None, else fall back to creating
    a name based on the URL.

    Unlike the rest of this module's functions, this function takes an entire
    course block/overview as a parameter. This is because a few test cases
    (specifically, {Text|Image|Video}AnnotationModuleTestCase.test_student_view)
    create scenarios where course.display_name is not None but course.location
    is None, which causes calling course.url_name to fail. So, although we'd
    like to just pass course.display_name and course.url_name as arguments to
    this function, we can't do so without breaking those tests.

    Note: This method no longer escapes as it once did, so the caller must
    ensure it is properly escaped where necessary.

    Arguments:
        block (XModuleMixin|CourseOverview|BlockStructureBlockData):
            Block that is being accessed
    """
    return (
        block.display_name if block.display_name is not None
        else block.scope_ids.usage_id.block_id.replace('_', ' ')
    )
